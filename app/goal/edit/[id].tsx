import { useLocalSearchParams, useRouter } from 'expo-router';
import { paiseToInput } from '../../../src/domain/ledger';
import { GoalForm } from '../../../src/components/GoalForm';
import { EmptyState, Screen, ScreenHeader } from '../../../src/components/ui';
import { useBooks } from '../../../src/data/useBooks';

export default function EditGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = typeof id === 'string' ? id : '';
  const books = useBooks();
  const goal = books.goals.find((item) => item.id === goalId && !item.deletedAt);
  const presented = books.active.find((item) => item.id === goalId);
  if (!goal || !presented) {
    return (
      <Screen>
        <ScreenHeader title="Edit Goal" onBack={() => router.back()} />
        <EmptyState title="This goal is not active" body="Deleted goals stay in your history, and their details can no longer be edited." />
      </Screen>
    );
  }
  return (
    <GoalForm
      title="Edit Goal"
      submitLabel="Save Goal"
      categories={books.categories}
      allocatedPaise={presented.allocatedPaise}
      initial={{
        name: goal.name,
        categoryId: goal.categoryId,
        target: paiseToInput(goal.targetPaise),
        targetDate: goal.targetDate ?? '',
        imageUri: goal.imageUri,
      }}
      onSubmit={async (draft) => {
        await books.updateGoal(goal.id, draft);
        router.back();
      }}
    />
  );
}
