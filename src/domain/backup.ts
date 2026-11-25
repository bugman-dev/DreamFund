import {
  BACKUP_VERSION,
  CATEGORY_NAME_LIMIT,
  DEFAULT_ICON,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  GOAL_DELETED_REASON,
  IMAGE_URI_LIMIT,
  TRANSACTION_TYPES,
} from '../constants';
import { t } from '../locale/messages';
import type { CurrencyId } from './money';
import type { Category } from './categories';
import { isIconName } from './icons';
import {
  replayLedger,
  type AuditRecord,
  type Clock,
  type GoalRecord,
  type LedgerState,
  type TxRecord,
  type TxType,
} from './ledger';

export type Preferences = {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
};

export type BackupFile = {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  categories: Category[];
  goals: GoalRecord[];
  transactions: TxRecord[];
  audits: AuditRecord[];
  preferences: Preferences;
  /** Goal id → filename stored beside this JSON in Drive appDataFolder. */
  imageFiles?: Record<string, string>;
};

export type RestoredBackup = {
  categories: Category[];
  state: LedgerState;
  preferences: Preferences;
};

const TX_TYPES: TxType[] = [...TRANSACTION_TYPES];

export function restoreBackup(
  raw: unknown,
  clock: Clock,
  currency: CurrencyId = 'inr',
): { ok: true; data: RestoredBackup } | { ok: false; error: string } {
  if (!isRecord(raw) || raw.version !== BACKUP_VERSION) return fail(t('backup.notFile'));
  if (!Array.isArray(raw.categories) || !Array.isArray(raw.goals) || !Array.isArray(raw.transactions) || !Array.isArray(raw.audits)) {
    return fail(t('backup.missing'));
  }

  const categoryIds = new Map<string, string>();
  const customs: Category[] = [];
  const usedNames = new Set<string>();

  for (const item of raw.categories) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
      return fail(t('backup.category'));
    }
    const name = item.name.trim();
    if (!name || name.length > CATEGORY_NAME_LIMIT) return fail(t('backup.categoryName'));
    if (usedNames.has(name.toLowerCase())) return fail(t('backup.categoryConflict', { name }));
    usedNames.add(name.toLowerCase());
    const id = clock.id();
    categoryIds.set(item.id, id);
    customs.push({
      id,
      name,
      icon: typeof item.icon === 'string' && isIconName(item.icon) ? item.icon : DEFAULT_ICON,
      isPreset: false,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : customs.length,
    });
  }

  const goalIds = new Map<string, string>();
  const goals: GoalRecord[] = [];
  for (const item of raw.goals) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.categoryId !== 'string') {
      return fail(t('backup.goal'));
    }
    const categoryId = categoryIds.get(item.categoryId);
    if (!categoryId) return fail(t('backup.goalCategory', { name: item.name }));
    if (!Number.isInteger(item.targetPaise) || Number(item.targetPaise) <= 0) return fail(t('backup.goalTarget', { name: item.name }));
    const id = clock.id();
    goalIds.set(item.id, id);
    goals.push({
      id,
      name: item.name.trim() || t('present.goal'),
      categoryId,
      targetPaise: Number(item.targetPaise),
      targetDate: typeof item.targetDate === 'string' ? item.targetDate : null,
      imageUri: typeof item.imageUri === 'string' ? item.imageUri.slice(0, IMAGE_URI_LIMIT) : null,
      deletedAt: typeof item.deletedAt === 'string' ? item.deletedAt : null,
      categorySnapshot: typeof item.categorySnapshot === 'string' ? item.categorySnapshot : null,
      categoryIconSnapshot: typeof item.categoryIconSnapshot === 'string' ? item.categoryIconSnapshot : null,
    });
  }

  const transactionIds = new Map<string, string>();
  const transactions: TxRecord[] = [];
  for (const item of raw.transactions) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.goalId !== 'string') {
      return fail(t('backup.transaction'));
    }
    if (!TX_TYPES.includes(item.type as TxType)) return fail(t('backup.txType'));
    if (!Number.isInteger(item.amountPaise) || Number(item.amountPaise) <= 0) return fail(t('backup.txAmount'));
    const goalId = goalIds.get(item.goalId);
    if (!goalId) return fail(t('backup.txGoal'));
    const counterGoalId = typeof item.counterGoalId === 'string' ? goalIds.get(item.counterGoalId) ?? null : null;
    if (item.type === 'transfer' && !counterGoalId) return fail(t('backup.transferDest'));
    const id = clock.id();
    transactionIds.set(item.id, id);
    transactions.push({
      id,
      type: item.type as TxType,
      amountPaise: Number(item.amountPaise),
      date: typeof item.date === 'string' ? item.date : '',
      note: typeof item.note === 'string' ? item.note : '',
      goalId,
      counterGoalId: item.type === 'transfer' ? counterGoalId : null,
      lockedReason: item.lockedReason === GOAL_DELETED_REASON ? GOAL_DELETED_REASON : null,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : clock.now,
    });
  }

  const audits: AuditRecord[] = [];
  for (const item of raw.audits) {
    if (!isRecord(item) || typeof item.transactionId !== 'string' || !isRecord(item.previous) || !isRecord(item.updated)) {
      return fail(t('backup.audit'));
    }
    const transactionId = transactionIds.get(item.transactionId);
    if (!transactionId) return fail(t('backup.auditTx'));
    const previous = snapshot(item.previous, goalIds);
    const updated = snapshot(item.updated, goalIds);
    if (!previous || !updated) return fail(t('backup.auditValues'));
    audits.push({
      id: clock.id(),
      transactionId,
      previous,
      updated,
      editedAt: typeof item.editedAt === 'string' ? item.editedAt : clock.now,
    });
  }

  const state: LedgerState = { goals, transactions, audits };
  const projected = replayLedger(state, currency);
  if (!projected.ok) return projected;

  return {
    ok: true,
    data: {
      categories: customs,
      state,
      preferences: readPreferences(raw.preferences),
    },
  };
}

function readPreferences(value: unknown): Preferences {
  if (!isRecord(value)) return { reminderEnabled: false, reminderHour: DEFAULT_REMINDER_HOUR, reminderMinute: DEFAULT_REMINDER_MINUTE };
  const hour = Number(value.reminderHour);
  const minute = Number(value.reminderMinute);
  return {
    reminderEnabled: value.reminderEnabled === true,
    reminderHour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_REMINDER_HOUR,
    reminderMinute: Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : DEFAULT_REMINDER_MINUTE,
  };
}

function snapshot(value: Record<string, unknown>, goalIds: Map<string, string>) {
  const goalId = typeof value.goalId === 'string' ? goalIds.get(value.goalId) : undefined;
  if (!goalId || !Number.isInteger(value.amountPaise)) return null;
  const counter = typeof value.counterGoalId === 'string' ? goalIds.get(value.counterGoalId) ?? null : null;
  return {
    amountPaise: Number(value.amountPaise),
    date: typeof value.date === 'string' ? value.date : '',
    note: typeof value.note === 'string' ? value.note : '',
    goalId,
    counterGoalId: counter,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function fail(error: string) {
  return { ok: false as const, error };
}
