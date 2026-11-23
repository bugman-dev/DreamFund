import { randomUUID } from 'expo-crypto';
import type { BackupFile } from '../domain/backup';
import { restoreBackup } from '../domain/backup';
import type { Category } from '../domain/categories';
import { deviceClock } from '../domain/clock';
import { isIconName } from '../domain/icons';
import { BACKUP_VERSION, CATEGORY_NAME_LIMIT, DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE, FALLBACK_ICON } from '../constants';
import { t } from '../locale/messages';
import {
  applyAddition,
  applyEdit,
  applyGoalDeletion,
  applyGoalPatch,
  applyTransfer,
  applyWithdrawal,
  project,
  reconciliationError,
  validateGoalDraft,
  type AuditRecord,
  type GoalRecord,
  type LedgerResult,
  type LedgerState,
  type TxRecord,
  type TxSnapshot,
} from '../domain/ledger';
import type { Preferences } from '../domain/backup';
import type { SessionUser } from '../auth/types';
import { enqueue, getDatabase } from './database';

export type LoadedData = {
  categories: Category[];
  state: LedgerState;
  allocated: Record<string, number>;
  preferences: Preferences;
};

type GoalRow = {
  id: string;
  name: string;
  category_id: string;
  target_paise: number;
  allocated_paise: number;
  target_date: string | null;
  image_uri: string | null;
  deleted_at: string | null;
  category_snapshot: string | null;
  category_icon_snapshot: string | null;
};

type TxRow = {
  id: string;
  type: TxRecord['type'];
  amount_paise: number;
  date: string;
  note: string;
  goal_id: string;
  counter_goal_id: string | null;
  locked_reason: TxRecord['lockedReason'];
  created_at: string;
};

type AuditRow = {
  id: string;
  transaction_id: string;
  previous_json: string;
  updated_json: string;
  edited_at: string;
};

export async function ensureUser(user: SessionUser): Promise<void> {
  await enqueue(async () => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO users (id, name, email, photo_url, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email, photo_url = excluded.photo_url`,
      user.sub,
      user.name,
      user.email,
      user.photoUrl,
      now,
    );
    await db.runAsync(
      `DELETE FROM categories
       WHERE user_id = ? AND is_preset = 1
         AND id NOT IN (SELECT category_id FROM goals WHERE user_id = ?)`,
      user.sub,
      user.sub,
    );
    await db.runAsync('UPDATE categories SET is_preset = 0 WHERE user_id = ? AND is_preset = 1', user.sub);
    await db.runAsync(
      `INSERT INTO preferences (user_id, reminder_enabled, reminder_hour, reminder_minute)
       VALUES (?, 0, ?, ?)
       ON CONFLICT(user_id) DO NOTHING`,
      user.sub,
      DEFAULT_REMINDER_HOUR,
      DEFAULT_REMINDER_MINUTE,
    );
  });
}

export async function loadAll(userId: string): Promise<LoadedData> {
  return enqueue(async () => {
    const db = await getDatabase();
    const state = await readState(userId);
    const projected = project(state);
    if (!projected.ok) throw new Error(projected.error);
    for (const goal of state.goals) {
      const amount = projected.allocated.get(goal.id) ?? 0;
      await db.runAsync('UPDATE goals SET allocated_paise = ? WHERE id = ? AND user_id = ? AND allocated_paise != ?', amount, goal.id, userId, amount);
    }
    return {
      categories: await readCategories(userId),
      state,
      allocated: Object.fromEntries(projected.allocated),
      preferences: await readPreferences(userId),
    };
  });
}

export async function createCategory(userId: string, name: string, icon: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > CATEGORY_NAME_LIMIT) throw new Error(t('error.categoryName'));
  if (!isIconName(icon)) throw new Error(t('error.chooseIcon'));
  return enqueue(async () => {
    const categories = await readCategories(userId);
    if (categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(t('error.categoryExists'));
    }
    const category: Category = {
      id: randomUUID(),
      name: trimmed,
      icon,
      isPreset: false,
      sortOrder: Math.max(-1, ...categories.map((item) => item.sortOrder)) + 1,
    };
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO categories (id, user_id, name, icon, is_preset, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
      category.id,
      userId,
      category.name,
      category.icon,
      category.sortOrder,
    );
    return category;
  });
}

export async function updateCategory(userId: string, id: string, name: string, icon: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > CATEGORY_NAME_LIMIT) throw new Error(t('error.categoryName'));
  if (!isIconName(icon)) throw new Error(t('error.chooseIcon'));
  await enqueue(async () => {
    const categories = await readCategories(userId);
    const current = categories.find((category) => category.id === id);
    if (!current) throw new Error(t('error.categoryMissing'));
    if (categories.some((category) => category.id !== id && category.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(t('error.categoryExists'));
    }
    const db = await getDatabase();
    await db.runAsync('UPDATE categories SET name = ?, icon = ? WHERE id = ? AND user_id = ?', trimmed, icon, id, userId);
  });
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  await enqueue(async () => {
    const categories = await readCategories(userId);
    const current = categories.find((category) => category.id === id);
    if (!current) throw new Error(t('error.categoryMissing'));
    const state = await readState(userId);
    if (state.goals.some((goal) => goal.categoryId === id)) {
      throw new Error(t('error.categoryInUse'));
    }
    const db = await getDatabase();
    await db.runAsync('DELETE FROM categories WHERE id = ? AND user_id = ?', id, userId);
  });
}

export async function createGoal(
  userId: string,
  input: { name: string; categoryId: string; targetPaise: number; targetDate: string | null; imageUri: string | null },
): Promise<string> {
  const invalid = validateGoalDraft(input);
  if (invalid) throw new Error(invalid);
  const id = randomUUID();
  await enqueue(async () => {
    const categories = await readCategories(userId);
    if (!categories.some((category) => category.id === input.categoryId)) throw new Error(t('common.chooseCategory'));
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO goals (
        id, user_id, name, category_id, target_paise, allocated_paise, target_date, image_uri, deleted_at, category_snapshot, category_icon_snapshot, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL, NULL, NULL, ?)`,
      id,
      userId,
      input.name.trim(),
      input.categoryId,
      input.targetPaise,
      input.targetDate,
      input.imageUri,
      new Date().toISOString(),
    );
  });
  return id;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  patch: { name?: string; categoryId?: string; targetPaise?: number; targetDate?: string | null; imageUri?: string | null },
): Promise<void> {
  if (patch.categoryId) {
    const categories = await readCategories(userId);
    if (!categories.some((category) => category.id === patch.categoryId)) throw new Error(t('common.chooseCategory'));
  }
  await mutate(userId, (state) => applyGoalPatch(state, goalId, patch));
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const categories = await readCategories(userId);
  await mutate(userId, (state, clock) => {
    const goal = state.goals.find((item) => item.id === goalId);
    const category = categories.find((item) => item.id === goal?.categoryId);
    return applyGoalDeletion(state, {
      goalId,
      categoryName: category?.name ?? goal?.categorySnapshot ?? t('present.category'),
      categoryIcon: category?.icon ?? goal?.categoryIconSnapshot ?? FALLBACK_ICON,
    }, clock);
  });
}

export async function addMoney(userId: string, input: { goalId: string; amountPaise: number; date: string; note: string }): Promise<void> {
  await mutate(userId, (state, clock) => applyAddition(state, input, clock));
}

export async function withdrawMoney(userId: string, input: { goalId: string; amountPaise: number; date: string; note: string }): Promise<void> {
  await mutate(userId, (state, clock) => applyWithdrawal(state, input, clock));
}

export async function transferMoney(
  userId: string,
  input: { fromGoalId: string; toGoalId: string; amountPaise: number; date: string; note: string },
): Promise<void> {
  await mutate(userId, (state, clock) => applyTransfer(state, input, clock));
}

export async function editTransaction(
  userId: string,
  input: { transactionId: string; amountPaise?: number; date?: string; note?: string; goalId?: string; counterGoalId?: string | null },
): Promise<void> {
  await mutate(userId, (state, clock) => applyEdit(state, input, clock));
}

export async function savePreferences(userId: string, preferences: Preferences): Promise<void> {
  await enqueue(async () => {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO preferences (user_id, reminder_enabled, reminder_hour, reminder_minute)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         reminder_enabled = excluded.reminder_enabled,
         reminder_hour = excluded.reminder_hour,
         reminder_minute = excluded.reminder_minute`,
      userId,
      preferences.reminderEnabled ? 1 : 0,
      preferences.reminderHour,
      preferences.reminderMinute,
    );
  });
}

export async function buildBackup(userId: string): Promise<BackupFile> {
  const loaded = await loadAll(userId);
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    categories: loaded.categories,
    goals: loaded.state.goals,
    transactions: loaded.state.transactions,
    audits: loaded.state.audits,
    preferences: loaded.preferences,
  };
}

export async function importBackup(userId: string, raw: unknown): Promise<void> {
  const restored = restoreBackup(raw, deviceClock());
  if (!restored.ok) throw new Error(restored.error);
  const projected = project(restored.data.state);
  if (!projected.ok) throw new Error(projected.error);
  await enqueue(async () => {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM audits WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM transactions WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM goals WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM categories WHERE user_id = ?', userId);
      for (const category of restored.data.categories) {
        await db.runAsync(
          'INSERT INTO categories (id, user_id, name, icon, is_preset, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
          category.id,
          userId,
          category.name,
          category.icon,
          category.sortOrder,
        );
      }
      for (const goal of restored.data.state.goals) {
        await db.runAsync(
          `INSERT INTO goals (
            id, user_id, name, category_id, target_paise, allocated_paise, target_date, image_uri, deleted_at, category_snapshot, category_icon_snapshot, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          goal.id,
          userId,
          goal.name,
          goal.categoryId,
          goal.targetPaise,
          projected.allocated.get(goal.id) ?? 0,
          goal.targetDate,
          goal.imageUri,
          goal.deletedAt,
          goal.categorySnapshot,
          goal.categoryIconSnapshot,
          new Date().toISOString(),
        );
      }
      await insertTransactions(userId, restored.data.state);
      await db.runAsync(
        `INSERT INTO preferences (user_id, reminder_enabled, reminder_hour, reminder_minute)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           reminder_enabled = excluded.reminder_enabled,
           reminder_hour = excluded.reminder_hour,
           reminder_minute = excluded.reminder_minute`,
        userId,
        restored.data.preferences.reminderEnabled ? 1 : 0,
        restored.data.preferences.reminderHour,
        restored.data.preferences.reminderMinute,
      );
    });
  });
}

async function mutate(userId: string, recipe: (state: LedgerState, clock: ReturnType<typeof deviceClock>) => LedgerResult): Promise<void> {
  await enqueue(async () => {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      const state = await readState(userId);
      const clock = deviceClock();
      const result = recipe(state, clock);
      if (!result.ok) throw new Error(result.error);
      const projected = project(result.state);
      if (!projected.ok) throw new Error(projected.error);
      if (reconciliationError(result.state, projected.allocated)) throw new Error(t('error.reconcile'));
      await writeGoals(userId, result.state, projected.allocated);
      await db.runAsync('DELETE FROM audits WHERE user_id = ?', userId);
      await db.runAsync('DELETE FROM transactions WHERE user_id = ?', userId);
      await insertTransactions(userId, result.state);
    });
  });
}

async function writeGoals(userId: string, state: LedgerState, allocated: Map<string, number>): Promise<void> {
  const db = await getDatabase();
  for (const goal of state.goals) {
    const result = await db.runAsync(
      `UPDATE goals SET
        name = ?, category_id = ?, target_paise = ?, allocated_paise = ?, target_date = ?, image_uri = ?,
        deleted_at = ?, category_snapshot = ?, category_icon_snapshot = ?
       WHERE id = ? AND user_id = ?`,
      goal.name,
      goal.categoryId,
      goal.targetPaise,
      allocated.get(goal.id) ?? 0,
      goal.targetDate,
      goal.imageUri,
      goal.deletedAt,
      goal.categorySnapshot,
      goal.categoryIconSnapshot,
      goal.id,
      userId,
    );
    if (result.changes === 0) throw new Error(t('error.goalSave'));
  }
}

async function insertTransactions(userId: string, state: LedgerState): Promise<void> {
  const db = await getDatabase();
  for (const tx of state.transactions) {
    await db.runAsync(
      `INSERT INTO transactions (
        id, user_id, type, amount_paise, date, note, goal_id, counter_goal_id, locked_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tx.id,
      userId,
      tx.type,
      tx.amountPaise,
      tx.date,
      tx.note,
      tx.goalId,
      tx.counterGoalId,
      tx.lockedReason,
      tx.createdAt,
    );
  }
  for (const audit of state.audits) {
    await db.runAsync(
      'INSERT INTO audits (id, user_id, transaction_id, previous_json, updated_json, edited_at) VALUES (?, ?, ?, ?, ?, ?)',
      audit.id,
      userId,
      audit.transactionId,
      JSON.stringify(audit.previous),
      JSON.stringify(audit.updated),
      audit.editedAt,
    );
  }
}

async function readState(userId: string): Promise<LedgerState> {
  const db = await getDatabase();
  const goalRows = await db.getAllAsync<GoalRow>('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', userId);
  const txRows = await db.getAllAsync<TxRow>('SELECT * FROM transactions WHERE user_id = ?', userId);
  const auditRows = await db.getAllAsync<AuditRow>('SELECT * FROM audits WHERE user_id = ? ORDER BY edited_at ASC', userId);
  return {
    goals: goalRows.map(mapGoal),
    transactions: txRows.map(mapTx),
    audits: auditRows.map(mapAudit),
  };
}

async function readCategories(userId: string): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; name: string; icon: string; is_preset: number; sort_order: number }>(
    'SELECT id, name, icon, is_preset, sort_order FROM categories WHERE user_id = ? ORDER BY sort_order ASC',
    userId,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    isPreset: row.is_preset === 1,
    sortOrder: row.sort_order,
  }));
}

async function readPreferences(userId: string): Promise<Preferences> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ reminder_enabled: number; reminder_hour: number; reminder_minute: number }>(
    'SELECT reminder_enabled, reminder_hour, reminder_minute FROM preferences WHERE user_id = ?',
    userId,
  );
  return {
    reminderEnabled: row?.reminder_enabled === 1,
    reminderHour: row?.reminder_hour ?? DEFAULT_REMINDER_HOUR,
    reminderMinute: row?.reminder_minute ?? DEFAULT_REMINDER_MINUTE,
  };
}

function mapGoal(row: GoalRow): GoalRecord {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    targetPaise: row.target_paise,
    targetDate: row.target_date,
    imageUri: row.image_uri,
    deletedAt: row.deleted_at,
    categorySnapshot: row.category_snapshot,
    categoryIconSnapshot: row.category_icon_snapshot,
  };
}

function mapTx(row: TxRow): TxRecord {
  return {
    id: row.id,
    type: row.type,
    amountPaise: row.amount_paise,
    date: row.date,
    note: row.note,
    goalId: row.goal_id,
    counterGoalId: row.counter_goal_id,
    lockedReason: row.locked_reason,
    createdAt: row.created_at,
  };
}

function mapAudit(row: AuditRow): AuditRecord {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    previous: JSON.parse(row.previous_json) as TxSnapshot,
    updated: JSON.parse(row.updated_json) as TxSnapshot,
    editedAt: row.edited_at,
  };
}
