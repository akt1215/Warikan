import type * as SQLite from 'expo-sqlite';

import type { Transaction } from '../../types';
import { getDatabase } from './database';

interface TransactionRow {
  id: string;
  groupId: string;
  payerId: string;
  amount: number;
  originalCurrency: string;
  fee: number;
  convertedAmount: number;
  note: string;
  splitType: 'equal' | 'custom';
  splits: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  syncId: string;
}

const parseSplits = (raw: string): Transaction['splits'] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (entry) =>
          typeof entry === 'object' &&
          entry !== null &&
          'userId' in entry &&
          'amount' in entry &&
          'isPaid' in entry,
      )
    ) {
      return parsed as Transaction['splits'];
    }
  } catch {
    return [];
  }

  return [];
};

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  groupId: row.groupId,
  payerId: row.payerId,
  amount: row.amount,
  originalCurrency: row.originalCurrency,
  fee: row.fee,
  convertedAmount: row.convertedAmount,
  note: row.note,
  splitType: row.splitType,
  splits: parseSplits(row.splits),
  createdBy: row.createdBy,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  syncId: row.syncId,
});

const runInsert = async (
  database: SQLite.SQLiteDatabase,
  transaction: Transaction,
): Promise<void> => {
  await database.runAsync(
    `INSERT INTO transactions (
      id,
      groupId,
      payerId,
      amount,
      originalCurrency,
      fee,
      convertedAmount,
      note,
      splitType,
      splits,
      createdBy,
      createdAt,
      updatedAt,
      syncId
    ) VALUES (
      $id,
      $groupId,
      $payerId,
      $amount,
      $originalCurrency,
      $fee,
      $convertedAmount,
      $note,
      $splitType,
      $splits,
      $createdBy,
      $createdAt,
      $updatedAt,
      $syncId
    )`,
    {
      $id: transaction.id,
      $groupId: transaction.groupId,
      $payerId: transaction.payerId,
      $amount: transaction.amount,
      $originalCurrency: transaction.originalCurrency,
      $fee: transaction.fee,
      $convertedAmount: transaction.convertedAmount,
      $note: transaction.note,
      $splitType: transaction.splitType,
      $splits: JSON.stringify(transaction.splits),
      $createdBy: transaction.createdBy,
      $createdAt: transaction.createdAt,
      $updatedAt: transaction.updatedAt,
      $syncId: transaction.syncId,
    },
  );
};

export const createTransactionRecord = async (transaction: Transaction): Promise<void> => {
  const database = await getDatabase();
  await runInsert(database, transaction);
};

export const upsertTransactionRecord = async (transaction: Transaction): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO transactions (
      id,
      groupId,
      payerId,
      amount,
      originalCurrency,
      fee,
      convertedAmount,
      note,
      splitType,
      splits,
      createdBy,
      createdAt,
      updatedAt,
      syncId
    ) VALUES (
      $id,
      $groupId,
      $payerId,
      $amount,
      $originalCurrency,
      $fee,
      $convertedAmount,
      $note,
      $splitType,
      $splits,
      $createdBy,
      $createdAt,
      $updatedAt,
      $syncId
    )
    ON CONFLICT(id) DO UPDATE SET
      groupId = excluded.groupId,
      payerId = excluded.payerId,
      amount = excluded.amount,
      originalCurrency = excluded.originalCurrency,
      fee = excluded.fee,
      convertedAmount = excluded.convertedAmount,
      note = excluded.note,
      splitType = excluded.splitType,
      splits = excluded.splits,
      createdBy = excluded.createdBy,
      createdAt = excluded.createdAt,
      updatedAt = excluded.updatedAt,
      syncId = excluded.syncId`,
    {
      $id: transaction.id,
      $groupId: transaction.groupId,
      $payerId: transaction.payerId,
      $amount: transaction.amount,
      $originalCurrency: transaction.originalCurrency,
      $fee: transaction.fee,
      $convertedAmount: transaction.convertedAmount,
      $note: transaction.note,
      $splitType: transaction.splitType,
      $splits: JSON.stringify(transaction.splits),
      $createdBy: transaction.createdBy,
      $createdAt: transaction.createdAt,
      $updatedAt: transaction.updatedAt,
      $syncId: transaction.syncId,
    },
  );
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TransactionRow>(
    `SELECT id, groupId, payerId, amount, originalCurrency, fee, convertedAmount, note,
            splitType, splits, createdBy, createdAt, updatedAt, syncId
     FROM transactions
     ORDER BY createdAt DESC`,
  );

  return rows.map(toTransaction);
};

export const getTransactionsByGroup = async (groupId: string): Promise<Transaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TransactionRow>(
    `SELECT id, groupId, payerId, amount, originalCurrency, fee, convertedAmount, note,
            splitType, splits, createdBy, createdAt, updatedAt, syncId
     FROM transactions
     WHERE groupId = $groupId
     ORDER BY createdAt DESC`,
    { $groupId: groupId },
  );

  return rows.map(toTransaction);
};

export const getTransactionsSince = async (timestamp: number): Promise<Transaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TransactionRow>(
    `SELECT id, groupId, payerId, amount, originalCurrency, fee, convertedAmount, note,
            splitType, splits, createdBy, createdAt, updatedAt, syncId
     FROM transactions
     WHERE updatedAt > $timestamp
     ORDER BY createdAt DESC`,
    { $timestamp: timestamp },
  );

  return rows.map(toTransaction);
};

export const replaceAllTransactions = async (transactions: Transaction[]): Promise<void> => {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM transactions');

    for (const transaction of transactions) {
      await runInsert(database, transaction);
    }
  });
};
