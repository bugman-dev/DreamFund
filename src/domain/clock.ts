import { todayIso } from './dates';
import { createId } from './id';
import type { Clock } from './ledger';

export function deviceClock(now = new Date()): Clock {
  return {
    today: todayIso(now),
    now: now.toISOString(),
    id: () => createId(),
  };
}
