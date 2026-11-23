import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSession } from '../auth/session';
import type { Category } from '../domain/categories';
import type { Preferences } from '../domain/backup';
import { todayIso } from '../domain/dates';
import type { GoalRecord, TxRecord } from '../domain/ledger';
import { buildBackup, createCategory, createGoal, deleteCategory, deleteGoal, editTransaction, ensureUser, importBackup, loadAll, savePreferences, addMoney, transferMoney, updateCategory, updateGoal, withdrawMoney } from '../db/repository';
import { pickJson, shareJson } from '../db/transferFile';
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
  exportBackup: () => Promise<void>;
  importBackup: () => Promise<boolean>;
};

const emptyPreferences: Preferences = { reminderEnabled: false, reminderHour: 20, reminderMinute: 0 };
const DataContext = createContext<DataValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
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
    noticeTimer.current = setTimeout(() => setNotice(null), 2600);
  }

  async function reload(userId: string) {
    const loaded = await loadAll(userId);
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
        if (active) setError(reason instanceof Error ? reason.message : 'Dream Fund could not open your records.');
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
      if (!userId) throw new Error('Sign in to continue.');
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
        if (!userId) throw new Error('Sign in to continue.');
        const category = await createCategory(userId, name, icon);
        await reload(userId);
        return category;
      },
      updateCategory: (id, name, icon) => run((userId) => updateCategory(userId, id, name, icon), 'Category updated.'),
      deleteCategory: (id) => run((userId) => deleteCategory(userId, id), 'Category deleted.'),
      createGoal: async (input) => {
        if (!userId) throw new Error('Sign in to continue.');
        const id = await createGoal(userId, input);
        await reload(userId);
        flash(`${input.name.trim()} is ready.`);
        return id;
      },
      updateGoal: (id, patch) => run((userId) => updateGoal(userId, id, patch), 'Goal updated.'),
      deleteGoal: (id) => run((userId) => deleteGoal(userId, id), 'Goal deleted.'),
      addMoney: (input) => run((userId) => addMoney(userId, input), 'Money added.'),
      withdrawMoney: (input) => run((userId) => withdrawMoney(userId, input), 'Withdrawal recorded.'),
      transferMoney: (input) => run((userId) => transferMoney(userId, input), 'Transfer recorded.'),
      editTransaction: (input) => run((userId) => editTransaction(userId, input), 'Transaction updated.'),
      setReminder: async (enabled, hour, minute) => {
        const next = { reminderEnabled: enabled, reminderHour: hour, reminderMinute: minute };
        await syncReminder(next);
        await run((userId) => savePreferences(userId, next), enabled ? 'Daily reminder saved.' : 'Daily reminder turned off.');
      },
      exportBackup: async () => {
        if (!userId) throw new Error('Sign in to continue.');
        const backup = await buildBackup(userId);
        await shareJson(`dreamfund-backup-${todayIso()}.json`, JSON.stringify(backup, null, 2));
        flash('Backup ready.');
      },
      importBackup: async () => {
        if (!userId) throw new Error('Sign in to continue.');
        const text = await pickJson();
        if (text == null) return false;
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error('That file is not valid JSON.');
        }
        await importBackup(userId, parsed);
        await reload(userId);
        flash('Backup restored.');
        return true;
      },
    };
  }, [allocated, categories, error, goals, notice, preferences, ready, transactions, user]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('Records are unavailable.');
  return value;
}
