import { useLocalSearchParams } from 'expo-router';
import { MoneyForm } from '../../src/components/MoneyForm';
import { useBooks } from '../../src/data/useBooks';

export default function WithdrawScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const books = useBooks();
  const goalId = typeof params.goalId === 'string' ? params.goalId : undefined;
  return (
    <MoneyForm
      mode="withdraw"
      goals={books.active}
      initialGoalId={goalId}
      onSubmit={(input) => books.withdrawMoney({ goalId: input.goalId, amountPaise: input.amountPaise, date: input.date, note: input.note })}
    />
  );
}
