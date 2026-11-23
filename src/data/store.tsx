import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession } from '../auth/session';
import { useCurrency } from '../currency/Currency';
import type { Category } from '../domain/categories';
import type { Preferences } from '../domain/backup';
import { todayIso } from '../domain/dates';
import type { GoalRecord, TxRecord } from '../domain/ledger';
import { buildBackup, createCategory, createGoal, deleteCategory, deleteGoal, editTransaction, ensureUser, importBackup, loadAll, savePreferences, addMoney, transferMoney, updateCategory, updateGoal, withdrawMoney } from '../db/repository';
import { pickJson, shareJson } from '../db/transferFile';
import { BACKUP_FILE_PREFIX, DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE, NOTICE_MS } from '../constants';
import { t } from '../locale/messages';
import { syncReminder } from '../notifications/reminders';

type DataValue = {
  ready: boolean;
  error: string | null;
  notice: string | null;
  categories: Category[];
  goals: GoalRecord[];
  transactions: TxRecord[];
  allocated: Record<string, number>;
  preferences: Preferences;
  refresh: () => Promise<void>;
  clearNotice: () => void;
  createCategory: (name: string, icon: string) => Promise<Category>;
  updateCategory: (id: string, name: string, icon: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createGoal: (input: { name: string; categoryId: string; targetPaise: number; targetDate: string | null; imageUri: string | null }) => Promise<string>;
  updateGoal: (id: string, patch: { name?: string; categoryId?: string; targetPaise?: number; targetDate?: string | null; imageUri?: string | null }) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addMoney: (input: { goalId: string; amountPaise: number; date: string; note: string }) => Promise<void>;
  withdrawMoney: (input: { goalId: string; amountPaise: number; date: string; note: string }) => Promise<void>;
  transferMoney: (input: { fromGoalId: string; toGoalId: string; amountPaise: number; date: string; note: string }) => Promise<void>;
  editTransaction: (input: { transactionId: string; amountPaise?: number; date?: string; note?: string; goalId?: string; counterGoalId?: string | null }) => Promise<void>;
  setReminder: (enabled: boolean, hour: number, minute: number) => Promise<void>;
  shareBackupFile: () => Promise<void>;
  restoreBackupFromFile: () => Promise<boolean>;
};

const emptyPreferences: Preferences = { reminderEnabled: false, reminderHour: DEFAULT_REMINDER_HOUR, reminderMinute: DEFAULT_REMINDER_MINUTE };
const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { id: currencyId } = useCurrency();
  const currencyRef = useRef(currencyId);
  currencyRef.current = currencyId;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [allocated, setAllocated] = useState<Record<string, number>>({});
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(message: string) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }

  async function reload(userId: string) {
    const loaded = await loadAll(userId, currencyRef.current);
    setCategories(loaded.categories);
    setGoals(loaded.state.goals);
    setTransactions(loaded.state.transactions);
    setAllocated(loaded.allocated);
    setPreferences(loaded.preferences);
    setError(null);
  }

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setGoals([]);
      setTransactions([]);
      setAllocated({});
      setPreferences(emptyPreferences);
      setReady(true);
      setError(null);
      return;
    }
    let active = true;
    setReady(false);
    ensureUser(user)
      .then(() => reload(user.sub))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : t('records.openFailed'));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<DataValue>(() => {
    const userId = user?.sub;
    async function run(task: (id: string) => Promise<void>, message?: string) {
      if (!userId) throw new Error(t('auth.signIn'));
      await task(userId);
      await reload(userId);
      if (message) flash(message);
    }
    return {
      ready,
      error,
      notice,
      categories,
      goals,
      transactions,
      allocated,
      preferences,
      refresh: async () => {
        if (userId) await reload(userId);
      },
      clearNotice: () => setNotice(null),
      createCategory: async (name, icon) => {
        if (!userId) throw new Error(t('auth.signIn'));
        const category = await createCategory(userId, name, icon);
        await reload(userId);
        return category;
      },
      updateCategory: (id, name, icon) => run((userId) => updateCategory(userId, id, name, icon), t('categories.updated')),
      deleteCategory: (id) => run((userId) => deleteCategory(userId, id), t('categories.deleted')),
      createGoal: async (input) => {
        if (!userId) throw new Error(t('auth.signIn'));
        const id = await createGoal(userId, input, currencyRef.current);
        await reload(userId);
        flash(t('goal.ready', { name: input.name.trim() }));
        return id;
      },
      updateGoal: (id, patch) => run((userId) => updateGoal(userId, id, patch, currencyRef.current), t('goal.updated')),
      deleteGoal: (id) => run((userId) => deleteGoal(userId, id, currencyRef.current), t('goal.deleted')),
      addMoney: (input) => run((userId) => addMoney(userId, input, currencyRef.current), t('money.added')),
      withdrawMoney: (input) => run((userId) => withdrawMoney(userId, input, currencyRef.current), t('money.withdrawn')),
      transferMoney: (input) => run((userId) => transferMoney(userId, input, currencyRef.current), t('money.transferred')),
      editTransaction: (input) => run((userId) => editTransaction(userId, input, currencyRef.current), t('tx.updated')),
      setReminder: async (enabled, hour, minute) => {
        const next = { reminderEnabled: enabled, reminderHour: hour, reminderMinute: minute };
        await syncReminder(next);
        await run((userId) => savePreferences(userId, next), enabled ? t('profile.reminderSaved') : t('profile.reminderCleared'));
      },
      shareBackupFile: async () => {
        if (!userId) throw new Error(t('auth.signIn'));
        await publishBackupFile(userId);
        flash(t('profile.backupReady'));
      },
      restoreBackupFromFile: async () => {
        if (!userId) throw new Error(t('auth.signIn'));
        const payload = await readBackupPayload();
        if (payload == null) return false;
        await importBackup(userId, payload, currencyRef.current);
        await reload(userId);
        flash(t('profile.backupRestored'));
        return true;
      },
    };
  }, [allocated, categories, error, goals, notice, preferences, ready, transactions, user]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error(t('records.unavailable'));
  return value;
}

async function publishBackupFile(userId: string) {
  const backup = await buildBackup(userId);
  await shareJson(`${BACKUP_FILE_PREFIX}${todayIso()}.json`, JSON.stringify(backup, null, 2));
}

async function readBackupPayload(): Promise<unknown | null> {
  const text = await pickJson();
  if (text == null) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(t('profile.invalidJson'));
  }
}
