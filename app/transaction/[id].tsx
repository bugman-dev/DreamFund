import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GOAL_DELETED_REASON } from '../../src/constants';
import { todayIso } from '../../src/domain/dates';
import { NOTE_LIMIT, formatInr, paiseToInput, parseRupees } from '../../src/domain/ledger';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { DateField } from '../../src/components/DateField';
import { Button, ErrorText, Field, Screen, ScreenHeader } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { useText } from '../../src/locale';
import type { Palette } from '../../src/theme/palettes';
import { useColors } from '../../src/theme/Theme';
import { fonts } from '../../src/theme/type';

export default function EditTransactionScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = typeof id === 'string' ? id : '';
  const books = useBooks();
  const tx = books.transactions.find((item) => item.id === txId);
  if (!tx) {
    return (
      <Screen>
        <ScreenHeader title={text('tx.missingTitle')} onBack={() => router.back()} />
        <Text style={styles.missing}>{text('tx.missing')}</Text>
      </Screen>
    );
  }
  return <Editor tx={tx} />;
}

function Editor({ tx }: { tx: NonNullable<ReturnType<typeof useBooks>['transactions'][number]> }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const router = useRouter();
  const books = useBooks();
  const locked = tx.lockedReason === GOAL_DELETED_REASON;
  const [amount, setAmount] = useState(paiseToInput(tx.amountPaise));
  const [date, setDate] = useState(tx.date);
  const [note, setNote] = useState(tx.note);
  const [goalId, setGoalId] = useState(tx.goalId);
  const [counterGoalId, setCounterGoalId] = useState(tx.counterGoalId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const active = books.active;

  async function save() {
    const amountPaise = parseRupees(amount);
    if (amountPaise == null || amountPaise <= 0) {
      setError(text('money.amountRequired'));
      setConfirming(false);
      return;
    }
    setSaving(true);
    try {
      await books.editTransaction({
        transactionId: tx.id,
        amountPaise,
        date,
        note,
        goalId,
        counterGoalId: tx.type === 'transfer' ? counterGoalId : null,
      });
      router.back();
    } catch (reason) {
      setConfirming(false);
      setError(reason instanceof Error ? reason.message : text('tx.updateFailed'));
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button label={text('tx.save')} onPress={() => setConfirming(true)} disabled={saving} />}>
      <ScreenHeader title={text('tx.editTitle')} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.help}>{text('tx.help')}</Text>
        {locked ? <Text style={styles.help}>{text('tx.lockedHelp')}</Text> : null}
        <Field label={text('money.amount')}>
          <TextInput
            value={amount}
            editable={!locked}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={[styles.input, locked && styles.disabled]}
          />
        </Field>
        <DateField label={text('money.date')} value={date} onChange={setDate} maximumDate={todayIso()} />
        <Field label={text('money.notePlain')}>
          <TextInput value={note} onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))} multiline style={styles.note} />
          <Text style={styles.count}>{note.length}/{NOTE_LIMIT}</Text>
        </Field>
        <Field label={tx.type === 'transfer' ? text('money.from') : text('present.goal')}>
          <View style={styles.choices}>
            {(locked ? books.presented.filter((goal) => goal.id === tx.goalId) : active).map((goal) => (
              <Pressable key={goal.id} accessibilityRole="button" disabled={locked} onPress={() => setGoalId(goal.id)} style={[styles.choice, goalId === goal.id && styles.choiceOn]}>
                <Text style={[styles.choiceText, goalId === goal.id && styles.choiceTextOn]}>{goal.name}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        {tx.type === 'transfer' ? (
          <Field label={text('money.to')}>
            <View style={styles.choices}>
              {active.filter((goal) => goal.id !== goalId).map((goal) => (
                <Pressable key={goal.id} accessibilityRole="button" disabled={locked} onPress={() => setCounterGoalId(goal.id)} style={[styles.choice, counterGoalId === goal.id && styles.choiceOn]}>
                  <Text style={[styles.choiceText, counterGoalId === goal.id && styles.choiceTextOn]}>{goal.name}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
      </View>
      <ConfirmModal
        visible={confirming}
        title={text('tx.confirmTitle')}
        message={text('tx.confirmMessage', { amount: formatInr(tx.amountPaise) })}
        confirmLabel={text('common.save')}
        busy={saving}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void save()}
      />
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  body: { paddingHorizontal: 20 },
  help: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 12 },
  missing: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, padding: 20 },
  input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.grey, minHeight: 52, paddingHorizontal: 14, fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  note: { minHeight: 88, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.grey, padding: 14, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  count: { alignSelf: 'flex-end', marginTop: 6, fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  disabled: { opacity: 0.55 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grey, paddingHorizontal: 12, paddingVertical: 8 },
  choiceOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  choiceText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  choiceTextOn: { color: colors.onForest },
  });
}
