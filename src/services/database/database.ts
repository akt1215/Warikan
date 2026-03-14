import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  baseCurrency TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lastSyncedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  isDefault INTEGER NOT NULL,
  createdBy TEXT NOT NULL,
  memberIds TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  groupId TEXT NOT NULL,
  payerId TEXT NOT NULL,
  amount REAL NOT NULL,
  originalCurrency TEXT NOT NULL,
  fee REAL NOT NULL,
  convertedAmount REAL NOT NULL,
  note TEXT NOT NULL,
  splitType TEXT NOT NULL,
  splits TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  syncId TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS currency_acquisitions (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount REAL NOT NULL,
  paidAmount REAL NOT NULL,
  rate REAL NOT NULL,
  acquiredAt INTEGER NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  currency TEXT PRIMARY KEY NOT NULL,
  rateToBase REAL NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_groups_createdBy ON groups(createdBy);
CREATE INDEX IF NOT EXISTS idx_transactions_groupId ON transactions(groupId);
CREATE INDEX IF NOT EXISTS idx_transactions_syncId ON transactions(syncId);
CREATE INDEX IF NOT EXISTS idx_currency_acquisitions_user_currency ON currency_acquisitions(userId, currency);
`;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('warikan.db');
  }

  return databasePromise;
};

export const initializeDatabase = async (): Promise<void> => {
  const database = await getDatabase();
  await database.execAsync(SCHEMA_SQL);
};
