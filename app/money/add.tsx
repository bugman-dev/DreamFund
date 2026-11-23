import { useLocalSearchParams } from 'expo-router';
import { MoneyForm } from '../../src/components/MoneyForm';
import { useGoalSummary } from '../../src/data/useGoalSummary';
import { useData } from '../../src/data/store';

export default function AddMoneyScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const summary = useGoalSummary();
  const data = useData();
  const goalId = typeof params.goalId === 'string' ? params.goalId : undefined;
  return (
    <MoneyForm
      mode="add"
      goals={summary.active}
      initialGoalId={goalId}
      onSubmit={(input) => data.addMoney({ goalId: input.goalId, amountPaise: input.amountPaise, date: input.date, note: input.note })}
    />
  );
}
