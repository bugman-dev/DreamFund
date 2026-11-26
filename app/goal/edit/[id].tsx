import { useLocalSearchParams, useRouter } from "expo-router";
import { paiseToInput } from "../../../src/domain/ledger";
import { GoalForm } from "../../../src/components/GoalForm";
import { EmptyState, Screen, ScreenHeader } from "../../../src/components/ui";
import { useGoalSummary } from "../../../src/data/useGoalSummary";
import { useData } from "../../../src/data/store";
import { useText } from "../../../src/locale";

export default function EditGoalScreen() {
  const text = useText();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = typeof id === "string" ? id : "";
  const books = useGoalSummary();
  const data = useData();
  const goal = books.goals.find(
    (item) => item.id === goalId && !item.deletedAt,
  );
  const presented = books.active.find((item) => item.id === goalId);
  if (!goal || !presented) {
    return (
      <Screen>
        <ScreenHeader
          title={text("goal.editTitle")}
          onBack={() => router.back()}
        />
        <EmptyState
          title={text("goal.inactiveTitle")}
          body={text("goal.inactiveBody")}
        />
      </Screen>
    );
  }
  return (
    <GoalForm
      title={text("goal.editTitle")}
      submitLabel={text("goal.editSubmit")}
      categories={books.categories}
      allocatedPaise={presented.allocatedPaise}
      initial={{
        name: goal.name,
        categoryId: goal.categoryId,
        target: paiseToInput(goal.targetPaise),
        targetDate: goal.targetDate ?? "",
        imageUri: goal.imageUri,
      }}
      onSubmit={async (draft) => {
        await data.updateGoal(goal.id, draft);
        router.back();
      }}
    />
  );
}
