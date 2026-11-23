import { useMemo } from 'react';
import { presentGoal } from './present';
import { useData } from './store';

export function useBooks() {
  const data = useData();
  return useMemo(() => {
    const presented = data.goals.map((goal) => presentGoal(goal, data.allocated[goal.id] ?? 0, data.categories));
    const active = presented.filter((goal) => !goal.deleted);
    const saved = active.reduce((sum, goal) => sum + goal.allocatedPaise, 0);
    const target = active.reduce((sum, goal) => sum + goal.targetPaise, 0);
    return {
      ...data,
      presented,
      active,
      saved,
      target,
      progress: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
    };
  }, [data]);
}
