import type { SyncMergeResult, SyncPayload, Transaction } from '../types';
import { DEFAULT_TRANSACTION_LABEL } from '../constants';

const normalizeBySyncId = (transactions: ReadonlyArray<Transaction>): Transaction[] => {
  const map = new Map<string, Transaction>();

  for (const transaction of transactions) {
    const key = transaction.syncId || transaction.id;
    const existing = map.get(key);

    if (!existing || transaction.updatedAt > existing.updatedAt) {
      map.set(key, transaction);
    }
  }

  return Array.from(map.values());
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const applyDefaultTransactionLabel = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      return item;
    }

    if (typeof item.label === 'string' && item.label.trim()) {
      return item;
    }

    return {
      ...item,
      label: DEFAULT_TRANSACTION_LABEL,
    };
  });
};

const isValidTransactionArray = (value: unknown): value is Transaction[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.id === 'string' &&
      typeof item.groupId === 'string' &&
      typeof item.label === 'string' &&
      typeof item.payerId === 'string' &&
      typeof item.amount === 'number' &&
      typeof item.originalCurrency === 'string' &&
      typeof item.fee === 'number' &&
      typeof item.convertedAmount === 'number' &&
      typeof item.note === 'string' &&
      (item.splitType === 'equal' || item.splitType === 'custom') &&
      Array.isArray(item.splits) &&
      typeof item.createdBy === 'string' &&
      typeof item.createdAt === 'number' &&
      typeof item.updatedAt === 'number' &&
      typeof item.syncId === 'string'
    );
  });
};

export const createSyncPayload = (
  transactions: ReadonlyArray<Transaction>,
  generatedBy: string,
  sinceTimestamp = 0,
): string => {
  const incremental = transactions.filter(
    (transaction) => transaction.updatedAt > sinceTimestamp,
  );

  const payload: SyncPayload = {
    version: 1,
    generatedAt: Date.now(),
    generatedBy,
    transactions: normalizeBySyncId(incremental),
  };

  return JSON.stringify(payload);
};

export const parseSyncPayload = (rawPayload: string): SyncPayload => {
  const parsed: unknown = JSON.parse(rawPayload);

  if (!isRecord(parsed)) {
    throw new Error('Invalid payload format.');
  }

  if (parsed.version !== 1) {
    throw new Error('Unsupported payload version.');
  }

  if (typeof parsed.generatedAt !== 'number' || typeof parsed.generatedBy !== 'string') {
    throw new Error('Invalid payload metadata.');
  }

  const normalizedTransactions = applyDefaultTransactionLabel(parsed.transactions);

  if (!isValidTransactionArray(normalizedTransactions)) {
    throw new Error('Invalid transaction data in payload.');
  }

  return {
    version: 1,
    generatedAt: parsed.generatedAt,
    generatedBy: parsed.generatedBy,
    transactions: normalizeBySyncId(normalizedTransactions),
  };
};

export const mergeTransactions = (
  localTransactions: ReadonlyArray<Transaction>,
  incomingTransactions: ReadonlyArray<Transaction>,
): SyncMergeResult => {
  const mergedMap = new Map<string, Transaction>();

  for (const transaction of normalizeBySyncId(localTransactions)) {
    mergedMap.set(transaction.syncId, transaction);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const incomingTransaction of normalizeBySyncId(incomingTransactions)) {
    const existing = mergedMap.get(incomingTransaction.syncId);

    if (!existing) {
      mergedMap.set(incomingTransaction.syncId, incomingTransaction);
      added += 1;
      continue;
    }

    if (incomingTransaction.updatedAt > existing.updatedAt) {
      mergedMap.set(incomingTransaction.syncId, incomingTransaction);
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  const merged = Array.from(mergedMap.values()).sort(
    (left, right) => right.createdAt - left.createdAt,
  );

  return {
    merged,
    added,
    updated,
    skipped,
  };
};

export const mergeSyncPayload = (
  localTransactions: ReadonlyArray<Transaction>,
  rawPayload: string,
): SyncMergeResult => {
  const payload = parseSyncPayload(rawPayload);
  return mergeTransactions(localTransactions, payload.transactions);
};
