import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { todayIso } from '../../src/domain/dates';
import { NOTE_LIMIT, formatInr, paiseToInput, parseRupees } from '../../src/domain/ledger';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { DateField } from '../../src/components/DateField';
import { Button, ErrorText, Field, Screen, ScreenHeader } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/type';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = typeof id === 'string' ? id : '';
  const books = useBooks();
  const tx = books.transactions.find((item) => item.id === txId);
  if (!tx) {
    return (
      <Screen>
        <ScreenHeader title="Transaction" onBack={() => router.back()} />
        <Text style={styles.missing}>That transaction could not be found.</Text>
      </Screen>
    );
  }
  return <Editor tx={tx} />;
}

function Editor({ tx }: { tx: NonNullable<ReturnType<typeof useBooks>['transactions'][number]> }) {
  const router = useRouter();
  const books = useBooks();
  const locked = tx.lockedReason === 'goal_deleted';
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
      setError('Enter an amount greater than zero.');
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
      setError(reason instanceof Error ? reason.message : 'The transaction could not be updated.');
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button label="Save correction" onPress={() => setConfirming(true)} disabled={saving} />}>
      <ScreenHeader title="Edit transaction" onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.help}>Earlier values stay in the audit log. The transaction type stays the same.</Text>
        {locked ? <Text style={styles.help}>This withdrawal was recorded when the goal was deleted. Only the date and note can change.</Text> : null}
        <Field label="Amount">
          <TextInput
            value={amount}
            editable={!locked}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={[styles.input, locked && styles.disabled]}
          />
        </Field>
        <DateField label="Date" value={date} onChange={setDate} maximumDate={todayIso()} />
        <Field label="Note">
          <TextInput value={note} onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))} multiline style={styles.note} />
          <Text style={styles.count}>{note.length}/{NOTE_LIMIT}</Text>
        </Field>
        <Field label={tx.type === 'transfer' ? 'From' : 'Goal'}>
          <View style={styles.choices}>
            {(locked ? books.presented.filter((goal) => goal.id === tx.goalId) : active).map((goal) => (
              <Pressable key={goal.id} accessibilityRole="button" disabled={locked} onPress={() => setGoalId(goal.id)} style={[styles.choice, goalId === goal.id && styles.choiceOn]}>
                <Text style={[styles.choiceText, goalId === goal.id && styles.choiceTextOn]}>{goal.name}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        {tx.type === 'transfer' ? (
          <Field label="To">
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
        title="Save this correction?"
        message={`The balance will be recalculated. The previous amount was ${formatInr(tx.amountPaise)}.`}
        confirmLabel="Save"
        busy={saving}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void save()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  choiceTextOn: { color: colors.white },
});
