import { useRouter } from "expo-router";
import { GoalForm } from "../../src/components/GoalForm";
import { useData } from "../../src/data/store";
import { useText } from "../../src/locale";

export default function CreateGoalScreen() {
  const text = useText();
  const router = useRouter();
  const data = useData();
  return (
    <GoalForm
      title={text("goal.createTitle")}
      submitLabel={text("goal.createSubmit")}
      categories={data.categories}
      initial={{
        name: "",
        categoryId: data.categories[0]?.id ?? null,
        target: "",
        targetDate: "",
        imageUri: null,
      }}
      onSubmit={async (draft) => {
        const id = await data.createGoal(draft);
        router.replace(`/goal/${id}`);
      }}
    />
  );
}
