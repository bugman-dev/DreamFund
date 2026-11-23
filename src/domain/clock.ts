import { randomUUID } from 'expo-crypto';
import { todayIso } from './dates';
import type { Clock } from './ledger';

export function deviceClock(now = new Date()): Clock {
  return {
    today: todayIso(now),
    now: now.toISOString(),
    id: () => randomUUID(),
  };
}
