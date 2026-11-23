import { useLocalSearchParams } from 'expo-router';
import { MoneyForm } from '../../src/components/MoneyForm';
import { useBooks } from '../../src/data/useBooks';

export default function AddMoneyScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const books = useBooks();
  const goalId = typeof params.goalId === 'string' ? params.goalId : undefined;
  return (
    <MoneyForm
      mode="add"
      goals={books.active}
      initialGoalId={goalId}
      onSubmit={(input) => books.addMoney({ goalId: input.goalId, amountPaise: input.amountPaise, date: input.date, note: input.note })}
    />
  );
}
