import { useLocalSearchParams } from "expo-router";
import { MoneyForm } from "../../src/components/MoneyForm";
import { useGoalSummary } from "../../src/data/useGoalSummary";
import { useData } from "../../src/data/store";

export default function TransferMoneyScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const summary = useGoalSummary();
  const data = useData();
  const goalId = typeof params.goalId === "string" ? params.goalId : undefined;
  return (
    <MoneyForm
      mode="transfer"
      goals={summary.active}
      initialGoalId={goalId}
      onSubmit={(input) =>
        data.transferMoney({
          fromGoalId: input.goalId,
          toGoalId: input.counterGoalId ?? "",
          amountPaise: input.amountPaise,
          date: input.date,
          note: input.note,
        })
      }
    />
  );
}
