import { FALLBACK_ICON, PERCENT_MAX } from '../constants';
import { t } from '../locale/messages';
import type { Category } from '../domain/categories';
import { accentFor } from '../theme/colors';
import type { Palette } from '../theme/palettes';
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

export function presentGoal(goal: GoalRecord, allocatedPaise: number, categories: Category[], palette: Palette): PresentedGoal {
  const live = categories.find((category) => category.id === goal.categoryId);
  const categoryName = goal.deletedAt ? goal.categorySnapshot || live?.name || t('present.category') : live?.name || t('present.category');
  const categoryIcon = goal.deletedAt ? goal.categoryIconSnapshot || live?.icon || FALLBACK_ICON : live?.icon || FALLBACK_ICON;
  const remainingPaise = Math.max(0, goal.targetPaise - allocatedPaise);
  const progress = goal.targetPaise > 0 ? Math.min(PERCENT_MAX, Math.round((allocatedPaise / goal.targetPaise) * PERCENT_MAX)) : 0;
  return {
    id: goal.id,
    name: goal.name,
    imageUri: goal.imageUri,
    categoryId: goal.categoryId,
    categoryName,
    categoryIcon,
    accent: accentFor(categoryName, palette),
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
  if (!id) return t('present.goal');
  return goals.find((goal) => goal.id === id)?.name ?? t('present.deletedGoal');
}

export function transactionTitle(tx: TxRecord, goals: GoalRecord[]): string {
  if (tx.type === 'addition') return t('present.added', { goal: goalName(goals, tx.goalId) });
  if (tx.type === 'withdrawal') return t('present.withdrawn', { goal: goalName(goals, tx.goalId) });
  return t('present.transfer', { goal: goalName(goals, tx.goalId), counter: goalName(goals, tx.counterGoalId) });
}

