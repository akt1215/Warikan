import type {
  CurrencyAcquisition,
  Group,
  SyncMergeResult,
  SyncPayload,
  Transaction,
  TransactionTombstone,
} from '../types';
import { DEFAULT_TRANSACTION_LABEL } from '../constants';
import { mergeGroupMembers } from './groupInviteService';

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

const normalizeParticipantProfiles = (value: unknown): Record<string, string> => {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    throw new Error('Invalid participant profile data in payload.');
  }

  const normalized: Record<string, string> = {};
  for (const [rawId, rawName] of Object.entries(value)) {
    if (typeof rawName !== 'string') {
      throw new Error('Invalid participant profile data in payload.');
    }

    const id = rawId.trim();
    const name = rawName.trim();
    if (!id || !name) {
      continue;
    }

    normalized[id] = name;
  }

  return normalized;
};

const normalizeTransactionTombstones = (
  value: unknown,
): TransactionTombstone[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('Invalid tombstone data in payload.');
  }

  const tombstones: TransactionTombstone[] = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.syncId !== 'string' ||
      typeof entry.groupId !== 'string' ||
      typeof entry.deletedAt !== 'number' ||
      typeof entry.deletedBy !== 'string'
    ) {
      throw new Error('Invalid tombstone data in payload.');
    }

    const syncId = entry.syncId.trim();
    const groupId = entry.groupId.trim();
    const deletedBy = entry.deletedBy.trim();
    if (!syncId || !groupId || !deletedBy) {
      continue;
    }

    tombstones.push({
      syncId,
      groupId,
      deletedAt: entry.deletedAt,
      deletedBy,
    });
  }

  return mergeTransactionTombstones([], tombstones);
};

const normalizeCurrencyAcquisitions = (
  value: unknown,
): CurrencyAcquisition[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('Invalid currency acquisition data in payload.');
  }

  const acquisitions: CurrencyAcquisition[] = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.userId !== 'string' ||
      typeof entry.currency !== 'string' ||
      typeof entry.amount !== 'number' ||
      typeof entry.paidAmount !== 'number' ||
      typeof entry.rate !== 'number' ||
      typeof entry.acquiredAt !== 'number'
    ) {
      throw new Error('Invalid currency acquisition data in payload.');
    }

    const id = entry.id.trim();
    const userId = entry.userId.trim();
    const currency = entry.currency.trim();
    if (!id || !userId || !currency) {
      continue;
    }

    acquisitions.push({
      id,
      userId,
      currency,
      amount: entry.amount,
      paidAmount: entry.paidAmount,
      rate: entry.rate,
      acquiredAt: entry.acquiredAt,
      note: typeof entry.note === 'string' ? entry.note : undefined,
    });
  }

  return acquisitions.sort((left, right) => right.acquiredAt - left.acquiredAt);
};

const normalizeGroupMembers = (
  value: unknown,
  fallbackJoinedAt: number,
): Group['members'] => {
  if (!Array.isArray(value)) {
    throw new Error('Invalid group data in payload.');
  }

  const members: Group['members'] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      const normalizedId = entry.trim();
      if (!normalizedId) {
        continue;
      }

      members.push({
        id: normalizedId,
        name: normalizedId,
        joinedAt: fallbackJoinedAt,
      });
      continue;
    }

    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.name !== 'string') {
      throw new Error('Invalid group data in payload.');
    }

    const memberId = entry.id.trim();
    const memberName = entry.name.trim();
    if (!memberId || !memberName) {
      continue;
    }

    members.push({
      id: memberId,
      name: memberName,
      joinedAt: typeof entry.joinedAt === 'number' ? entry.joinedAt : fallbackJoinedAt,
    });
  }

  return mergeGroupMembers(members);
};

const normalizeGroups = (value: unknown): Group[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('Invalid group data in payload.');
  }

  const groupsById = new Map<string, Group>();
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.name !== 'string' ||
      typeof entry.isDefault !== 'boolean' ||
      typeof entry.createdBy !== 'string' ||
      typeof entry.createdAt !== 'number' ||
      typeof entry.updatedAt !== 'number'
    ) {
      throw new Error('Invalid group data in payload.');
    }

    const id = entry.id.trim();
    const name = entry.name.trim();
    const createdBy = entry.createdBy.trim();
    if (!id || !name || !createdBy) {
      continue;
    }

    const members = normalizeGroupMembers(
      Array.isArray(entry.members) ? entry.members : entry.memberIds,
      entry.createdAt,
    );
    const normalized: Group = {
      id,
      name,
      isDefault: entry.isDefault,
      createdBy,
      members,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };

    const existing = groupsById.get(id);
    if (!existing || normalized.updatedAt > existing.updatedAt) {
      groupsById.set(id, normalized);
    }
  }

  return Array.from(groupsById.values()).sort((left, right) => left.createdAt - right.createdAt);
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
  participantProfiles: Readonly<Record<string, string>> = {},
  transactionTombstones: ReadonlyArray<TransactionTombstone> = [],
  currencyAcquisitions: ReadonlyArray<CurrencyAcquisition> = [],
  groups: ReadonlyArray<Group> = [],
): string => {
  const incremental = transactions.filter(
    (transaction) => transaction.updatedAt > sinceTimestamp,
  );
  const tombstones = transactionTombstones.filter(
    (tombstone) => tombstone.deletedAt > sinceTimestamp,
  );

  const payload: SyncPayload = {
    version: 1,
    generatedAt: Date.now(),
    generatedBy,
    transactions: normalizeBySyncId(incremental),
    currencyAcquisitions: normalizeCurrencyAcquisitions(currencyAcquisitions),
    participantProfiles: normalizeParticipantProfiles(participantProfiles),
    transactionTombstones: mergeTransactionTombstones([], tombstones),
    groups: normalizeGroups(groups),
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
    currencyAcquisitions: normalizeCurrencyAcquisitions(parsed.currencyAcquisitions),
    participantProfiles: normalizeParticipantProfiles(parsed.participantProfiles),
    transactionTombstones: normalizeTransactionTombstones(parsed.transactionTombstones),
    groups: normalizeGroups(parsed.groups),
  };
};

export const mergeTransactionTombstones = (
  localTombstones: ReadonlyArray<TransactionTombstone>,
  incomingTombstones: ReadonlyArray<TransactionTombstone>,
): TransactionTombstone[] => {
  const merged = new Map<string, TransactionTombstone>();

  for (const tombstone of localTombstones) {
    merged.set(tombstone.syncId, tombstone);
  }

  for (const tombstone of incomingTombstones) {
    const existing = merged.get(tombstone.syncId);
    if (!existing || tombstone.deletedAt > existing.deletedAt) {
      merged.set(tombstone.syncId, tombstone);
    }
  }

  return Array.from(merged.values()).sort((left, right) => right.deletedAt - left.deletedAt);
};

export const applyTransactionTombstones = (
  transactions: ReadonlyArray<Transaction>,
  tombstones: ReadonlyArray<TransactionTombstone>,
): Transaction[] => {
  if (tombstones.length === 0 || transactions.length === 0) {
    return [...transactions];
  }

  const tombstonesBySyncId = new Map<string, TransactionTombstone>();
  for (const tombstone of tombstones) {
    const existing = tombstonesBySyncId.get(tombstone.syncId);
    if (!existing || tombstone.deletedAt > existing.deletedAt) {
      tombstonesBySyncId.set(tombstone.syncId, tombstone);
    }
  }

  return transactions.filter((transaction) => {
    const tombstone = tombstonesBySyncId.get(transaction.syncId);
    if (!tombstone) {
      return true;
    }

    return transaction.updatedAt > tombstone.deletedAt;
  });
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
  const merged = mergeTransactions(localTransactions, payload.transactions);
  const filtered = applyTransactionTombstones(
    merged.merged,
    payload.transactionTombstones ?? [],
  );

  return {
    ...merged,
    merged: filtered,
  };
};
