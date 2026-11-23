import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { todayIso } from '../domain/dates';
import { formatInr, NOTE_LIMIT, parseRupees } from '../domain/ledger';
import type { PresentedGoal } from '../data/present';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { useData } from '../data/store';
import { ConfirmModal } from './ConfirmModal';
import { DateField } from './DateField';
import { GoalImage } from './GoalImage';
import { Button, EmptyState, ErrorText, Field, LoadingScreen, Screen, ScreenHeader } from './ui';

const SHORTCUTS = [1000, 2000, 5000, 10000];

export function MoneyForm({
  mode,
  goals,
  initialGoalId,
  onSubmit,
}: {
  mode: 'add' | 'withdraw' | 'transfer';
  goals: PresentedGoal[];
  initialGoalId?: string;
  onSubmit: (input: { goalId: string; counterGoalId?: string; amountPaise: number; date: string; note: string }) => Promise<void>;
}) {
  const router = useRouter();
  const data = useData();
  const active = useMemo(() => goals.filter((goal) => !goal.deleted), [goals]);
  const [goalId, setGoalId] = useState('');
  const [counterGoalId, setCounterGoalId] = useState('');
  useEffect(() => {
    if (active.length === 0) return;
    setGoalId((current) => {
      if (current && active.some((goal) => goal.id === current)) return current;
      if (initialGoalId && active.some((goal) => goal.id === initialGoalId)) return initialGoalId;
      return active[0].id;
    });
  }, [active, initialGoalId]);
  useEffect(() => {
    if (mode !== 'transfer') return;
    setCounterGoalId((current) => {
      if (current && current !== goalId && active.some((goal) => goal.id === current)) return current;
      return active.find((goal) => goal.id !== goalId)?.id ?? '';
    });
  }, [active, goalId, mode]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const goal = active.find((item) => item.id === goalId);
  const counter = active.find((item) => item.id === counterGoalId);
  const title = mode === 'add' ? 'Add Money to Goal' : mode === 'withdraw' ? 'Withdraw from Goal' : 'Transfer Between Goals';
  const action = mode === 'add' ? 'Add Money' : mode === 'withdraw' ? 'Withdraw Money' : 'Transfer Money';

  const message = useMemo(() => {
    const paise = parseRupees(amount);
    if (!paise || !goal) return '';
    if (mode === 'add') return `Add ${formatInr(paise)} to ${goal.name}?`;
    if (mode === 'withdraw') return `Withdraw ${formatInr(paise)} from ${goal.name}?`;
    return `Transfer ${formatInr(paise)} from ${goal.name} to ${counter?.name ?? 'another goal'}?`;
  }, [amount, counter?.name, goal, mode]);

  if (!data.ready) {
    return (
      <Screen>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <LoadingScreen />
      </Screen>
    );
  }
  if (active.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <EmptyState title="Create a goal first" body="Every amount you record belongs to a goal." action="Create a goal" onAction={() => router.push('/goal/create')} />
      </Screen>
    );
  }
  if (mode === 'transfer' && active.length < 2) {
    return (
      <Screen>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <EmptyState title="You need two goals" body="A transfer moves money from one goal to another without changing your total savings." action="Create a goal" onAction={() => router.push('/goal/create')} />
      </Screen>
    );
  }

  function addShortcut(rupees: number) {
    const current = parseRupees(amount) ?? 0;
    setAmount(String((current + rupees * 100) / 100));
  }

  function askConfirm() {
    const paise = parseRupees(amount);
    if (!goal) return setError('Choose a goal.');
    if (paise == null || paise <= 0) return setError('Enter an amount greater than zero.');
    if (mode === 'transfer' && (!counter || counter.id === goal.id)) return setError('Choose two different goals.');
    if (note.trim().length > NOTE_LIMIT) return setError(`Notes can be up to ${NOTE_LIMIT} characters.`);
    setError(null);
    setConfirming(true);
  }

  async function confirm() {
    const paise = parseRupees(amount);
    if (!goal || paise == null) return;
    setSaving(true);
    try {
      await onSubmit({ goalId: goal.id, counterGoalId: counter?.id, amountPaise: paise, date, note: note.trim() });
      setConfirming(false);
      router.back();
    } catch (reason) {
      setConfirming(false);
      setError(reason instanceof Error ? reason.message : 'The amount could not be recorded.');
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button label={action} tone={mode === 'withdraw' ? 'danger' : 'primary'} onPress={askConfirm} disabled={saving} />}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      <View style={styles.body}>
        {mode === 'transfer' ? <Text style={styles.kicker}>From</Text> : null}
        <GoalRow goal={goal} onPress={() => setPicking('from')} detail={mode === 'withdraw' ? `${formatInr(goal?.allocatedPaise ?? 0)} available` : `${formatInr(goal?.allocatedPaise ?? 0)} of ${formatInr(goal?.targetPaise ?? 0)}`} />
        {mode === 'transfer' ? (
          <>
            <Text style={styles.kicker}>To</Text>
            <GoalRow goal={counter} onPress={() => setPicking('to')} detail={counter ? `${formatInr(counter.remainingPaise)} room left` : 'Choose a goal'} />
          </>
        ) : null}
        <Field label="Amount">
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.grey}
            style={styles.amount}
          />
        </Field>
        <View style={styles.shortcuts}>
          {SHORTCUTS.map((rupees) => (
            <Pressable key={rupees} accessibilityRole="button" onPress={() => addShortcut(rupees)} style={styles.shortcut}>
              <Text style={styles.shortcutText}>+{formatInr(rupees * 100)}</Text>
            </Pressable>
          ))}
        </View>
        <DateField label="Date" value={date} onChange={setDate} maximumDate={todayIso()} />
        <Field label="Note (Optional)">
          <TextInput
            value={note}
            onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))}
            placeholder={mode === 'withdraw' ? 'Used for booking advance refund' : 'Saved from this month’s surplus'}
            placeholderTextColor={colors.muted}
            multiline
            style={styles.note}
          />
          <Text style={styles.count}>{note.length}/{NOTE_LIMIT}</Text>
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </View>
      {picking ? (
        <View style={styles.picker}>
          {active.filter((item) => (picking === 'to' ? item.id !== goalId : true)).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => {
                if (picking === 'from') {
                  setGoalId(item.id);
                  if (item.id === counterGoalId) setCounterGoalId(active.find((goal) => goal.id !== item.id)?.id ?? '');
                } else {
                  setCounterGoalId(item.id);
                }
                setPicking(null);
              }}
              style={styles.pickerRow}
            >
              <Text style={styles.pickerName}>{item.name}</Text>
              <Text style={styles.pickerMeta}>{formatInr(item.allocatedPaise)} saved</Text>
            </Pressable>
          ))}
          <Button label="Close" tone="ghost" onPress={() => setPicking(null)} />
        </View>
      ) : null}
      <ConfirmModal
        visible={confirming}
        title={action}
        message={message}
        confirmLabel={action}
        tone={mode === 'withdraw' ? 'danger' : 'primary'}
        busy={saving}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

function GoalRow({ goal, detail, onPress }: { goal?: PresentedGoal; detail: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.goal}>
      <GoalImage uri={goal?.imageUri ?? null} style={styles.thumb} iconSize={18} />
      <View style={styles.goalText}>
        <Text style={styles.goalName}>{goal?.name ?? 'Choose a goal'}</Text>
        <Text style={styles.goalDetail}>{detail}</Text>
      </View>
      <ChevronDown color={colors.muted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  kicker: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginBottom: 8 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 16 },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  goalText: { flex: 1 },
  goalName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  goalDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 40, color: colors.ink, backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 16 },
  shortcut: { backgroundColor: colors.paleSage, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  shortcutText: { fontFamily: fonts.medium, fontSize: 13, color: colors.forest },
  note: { minHeight: 88, borderRadius: 14, borderWidth: 1, borderColor: colors.grey, backgroundColor: colors.white, padding: 14, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 6 },
  picker: { marginHorizontal: 20, backgroundColor: colors.white, borderRadius: 12, padding: 12, gap: 8 },
  pickerRow: { paddingVertical: 10, paddingHorizontal: 8 },
  pickerName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  pickerMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
});
