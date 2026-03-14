import type * as SQLite from 'expo-sqlite';

import { DEFAULT_TRANSACTION_LABEL } from '../../constants';
import type { Transaction } from '../../types';
import { getDatabase } from './database';

interface TransactionRow {
  id: string;
  groupId: string;
  label: string;
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

interface TransactionDeletionRow {
  syncId: string;
  groupId: string;
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
  label: row.label.trim() || DEFAULT_TRANSACTION_LABEL,
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
      label,
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
      $label,
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
      $label: transaction.label,
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
      label,
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
      $label,
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
      label = excluded.label,
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
      $label: transaction.label,
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
            label, splitType, splits, createdBy, createdAt, updatedAt, syncId
     FROM transactions
     ORDER BY createdAt DESC`,
  );

  return rows.map(toTransaction);
};

export const getTransactionsByGroup = async (groupId: string): Promise<Transaction[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TransactionRow>(
    `SELECT id, groupId, payerId, amount, originalCurrency, fee, convertedAmount, note,
            label, splitType, splits, createdBy, createdAt, updatedAt, syncId
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
            label, splitType, splits, createdBy, createdAt, updatedAt, syncId
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

export const countTransactionsByGroup = async (groupId: string): Promise<number> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM transactions
     WHERE groupId = $groupId`,
    { $groupId: groupId },
  );

  return row?.count ?? 0;
};

export const moveTransactionsToGroup = async (
  sourceGroupId: string,
  targetGroupId: string,
): Promise<void> => {
  const database = await getDatabase();
  const timestamp = Date.now();

  await database.runAsync(
    `UPDATE transactions
     SET groupId = $targetGroupId,
         updatedAt = $updatedAt
     WHERE groupId = $sourceGroupId`,
    {
      $targetGroupId: targetGroupId,
      $updatedAt: timestamp,
      $sourceGroupId: sourceGroupId,
    },
  );
};

export interface DeletedTransactionMeta {
  syncId: string;
  groupId: string;
}

export interface DeleteTransactionsByGroupResult {
  deletedCount: number;
  deletedTransactions: DeletedTransactionMeta[];
}

export const deleteTransactionRecord = async (
  transactionId: string,
  createdBy: string,
): Promise<DeletedTransactionMeta | null> => {
  const database = await getDatabase();
  const target = await database.getFirstAsync<TransactionDeletionRow>(
    `SELECT syncId, groupId
     FROM transactions
     WHERE id = $id AND createdBy = $createdBy`,
    {
      $id: transactionId,
      $createdBy: createdBy,
    },
  );

  if (!target) {
    return null;
  }

  const result = await database.runAsync(
    `DELETE FROM transactions
     WHERE id = $id AND createdBy = $createdBy`,
    {
      $id: transactionId,
      $createdBy: createdBy,
    },
  );

  if (result.changes <= 0) {
    return null;
  }

  return {
    syncId: target.syncId,
    groupId: target.groupId,
  };
};

export const deleteTransactionsByGroup = async (
  groupId: string,
): Promise<DeleteTransactionsByGroupResult> => {
  const database = await getDatabase();
  const deletedTransactions = await database.getAllAsync<TransactionDeletionRow>(
    `SELECT syncId, groupId
     FROM transactions
     WHERE groupId = $groupId`,
    { $groupId: groupId },
  );

  const result = await database.runAsync(
    `DELETE FROM transactions
     WHERE groupId = $groupId`,
    {
      $groupId: groupId,
    },
  );

  return {
    deletedCount: result.changes,
    deletedTransactions: deletedTransactions.map((entry) => ({
      syncId: entry.syncId,
      groupId: entry.groupId,
    })),
  };
};
