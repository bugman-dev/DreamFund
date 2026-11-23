import type { Category } from '../domain/categories';
import { accentFor } from '../theme/colors';
import type { GoalRecord, TxRecord } from '../domain/ledger';

export type PresentedGoal = {
  id: string;
  name: string;
  imageUri: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  accent: string;
  allocatedPaise: number;
  targetPaise: number;
  remainingPaise: number;
  progress: number;
  completed: boolean;
  targetDate: string | null;
  deleted: boolean;
};

export function presentGoal(goal: GoalRecord, allocatedPaise: number, categories: Category[]): PresentedGoal {
  const live = categories.find((category) => category.id === goal.categoryId);
  const categoryName = goal.deletedAt ? goal.categorySnapshot || live?.name || 'Category' : live?.name || 'Category';
  const categoryIcon = goal.deletedAt ? goal.categoryIconSnapshot || live?.icon || 'Ellipsis' : live?.icon || 'Ellipsis';
  const remainingPaise = Math.max(0, goal.targetPaise - allocatedPaise);
  const progress = goal.targetPaise > 0 ? Math.min(100, Math.round((allocatedPaise / goal.targetPaise) * 100)) : 0;
  return {
    id: goal.id,
    name: goal.name,
    imageUri: goal.imageUri,
    categoryId: goal.categoryId,
    categoryName,
    categoryIcon,
    accent: accentFor(categoryName),
    allocatedPaise,
    targetPaise: goal.targetPaise,
    remainingPaise,
    progress,
    completed: goal.targetPaise > 0 && allocatedPaise >= goal.targetPaise,
    targetDate: goal.targetDate,
    deleted: Boolean(goal.deletedAt),
  };
}

export function goalName(goals: GoalRecord[], id: string | null): string {
  if (!id) return 'Goal';
  return goals.find((goal) => goal.id === id)?.name ?? 'Deleted goal';
}

export function transactionTitle(tx: TxRecord, goals: GoalRecord[]): string {
  if (tx.type === 'addition') return `Added to ${goalName(goals, tx.goalId)}`;
  if (tx.type === 'withdrawal') return `Withdrawn from ${goalName(goals, tx.goalId)}`;
  return `From ${goalName(goals, tx.goalId)} to ${goalName(goals, tx.counterGoalId)}`;
}

export function transactionDetail(tx: TxRecord, goals: GoalRecord[]): string {
  if (tx.note) return tx.note;
  if (tx.type === 'transfer') return `From ${goalName(goals, tx.goalId)}`;
  return '';
}
