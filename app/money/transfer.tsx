import { useLocalSearchParams } from 'expo-router';
import { MoneyForm } from '../../src/components/MoneyForm';
import { useBooks } from '../../src/data/useBooks';

export default function TransferScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const books = useBooks();
  const goalId = typeof params.goalId === 'string' ? params.goalId : undefined;
  return (
    <MoneyForm
      mode="transfer"
      goals={books.active}
      initialGoalId={goalId}
      onSubmit={(input) => books.transferMoney({
        fromGoalId: input.goalId,
        toGoalId: input.counterGoalId ?? '',
        amountPaise: input.amountPaise,
        date: input.date,
        note: input.note,
      })}
    />
  );
}
