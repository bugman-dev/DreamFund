import { useMemo } from 'react';
import { PERCENT_MAX } from '../constants';
import { useColors } from '../theme/Theme';
import { presentGoal } from './present';
import { useData } from './store';

export function useBooks() {
  const data = useData();
  const colors = useColors();
  return useMemo(() => {
    const presented = data.goals.map((goal) => presentGoal(goal, data.allocated[goal.id] ?? 0, data.categories, colors));
    const active = presented.filter((goal) => !goal.deleted);
    const saved = active.reduce((sum, goal) => sum + goal.allocatedPaise, 0);
    const target = active.reduce((sum, goal) => sum + goal.targetPaise, 0);
    return {
      ...data,
      presented,
      active,
      saved,
      target,
      progress: target > 0 ? Math.min(PERCENT_MAX, Math.round((saved / target) * PERCENT_MAX)) : 0,
    };
  }, [colors, data]);
}
