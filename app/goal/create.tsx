import { useRouter } from 'expo-router';
import { GoalForm } from '../../src/components/GoalForm';
import { useData } from '../../src/data/store';

export default function CreateGoalScreen() {
  const router = useRouter();
  const data = useData();
  return (
    <GoalForm
      title="Create New Goal"
      submitLabel="Create Goal"
      categories={data.categories}
      initial={{ name: '', categoryId: data.categories[0]?.id ?? null, target: '', targetDate: '', imageUri: null }}
      onSubmit={async (draft) => {
        const id = await data.createGoal(draft);
        router.replace(`/goal/${id}`);
      }}
    />
  );
}
