import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME } from '../constants';

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_preset INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  target_paise INTEGER NOT NULL,
  allocated_paise INTEGER NOT NULL,
  target_date TEXT,
  image_uri TEXT,
  deleted_at TEXT,
  category_snapshot TEXT,
  category_icon_snapshot TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  counter_goal_id TEXT,
  locked_reason TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  previous_json TEXT NOT NULL,
  updated_json TEXT NOT NULL,
  edited_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS preferences (
  user_id TEXT PRIMARY KEY NOT NULL,
  reminder_enabled INTEGER NOT NULL,
  reminder_hour INTEGER NOT NULL,
  reminder_minute INTEGER NOT NULL
);
`;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let queue: Promise<unknown> = Promise.resolve();

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await db.execAsync(SCHEMA);
        return db;
      })
      .catch((error) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}

export function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
