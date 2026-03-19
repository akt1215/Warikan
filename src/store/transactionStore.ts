import { create } from 'zustand';

import type {
  Transaction,
  TransactionEditableInput,
  TransactionInput,
  TransactionTombstone,
} from '../types';
import {
  countTransactionsByGroup,
  createTransactionRecord,
  deleteTransactionRecord,
  deleteTransactionsByGroup as deleteTransactionsByGroupInDb,
  getAllTransactions,
  getAllTransactionTombstones,
  getTransactionsByGroup,
  moveTransactionsToGroup as moveTransactionsToGroupInDb,
  replaceAllTransactions,
  upsertTransactionTombstones as upsertTransactionTombstonesInDb,
  upsertTransactionRecord,
} from '../services/database';
import { generateId } from '../utils';

interface TransactionStoreState {
  transactions: Transaction[];
  tombstones: TransactionTombstone[];
  isLoading: boolean;
  loadTransactions: () => Promise<void>;
  loadTransactionsByGroup: (groupId: string) => Promise<Transaction[]>;
  addTransaction: (input: TransactionInput) => Promise<Transaction>;
  updateTransaction: (
    transactionId: string,
    input: TransactionEditableInput,
    userId: string,
  ) => Promise<Transaction>;
  replaceTransactions: (transactions: Transaction[]) => Promise<void>;
  upsertTombstones: (tombstones: TransactionTombstone[]) => Promise<void>;
  upsertTransactions: (transactions: Transaction[]) => Promise<void>;
  countTransactionsInGroup: (groupId: string) => Promise<number>;
  moveTransactionsToGroup: (sourceGroupId: string, targetGroupId: string) => Promise<void>;
  deleteTransaction: (transactionId: string, userId: string) => Promise<void>;
  deleteTransactionsByGroup: (groupId: string, deletedBy: string) => Promise<number>;
}

const mergeTombstones = (
  current: ReadonlyArray<TransactionTombstone>,
  incoming: ReadonlyArray<TransactionTombstone>,
): TransactionTombstone[] => {
  const map = new Map<string, TransactionTombstone>();

  for (const tombstone of current) {
    map.set(tombstone.syncId, tombstone);
  }

  for (const tombstone of incoming) {
    const existing = map.get(tombstone.syncId);
    if (!existing || tombstone.deletedAt >= existing.deletedAt) {
      map.set(tombstone.syncId, tombstone);
    }
  }

  return Array.from(map.values()).sort((left, right) => right.deletedAt - left.deletedAt);
};

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  transactions: [],
  tombstones: [],
  isLoading: false,

  loadTransactions: async () => {
    set({ isLoading: true });

    try {
      const [transactions, tombstones] = await Promise.all([
        getAllTransactions(),
        getAllTransactionTombstones(),
      ]);
      set({ transactions, tombstones });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTransactionsByGroup: async (groupId) => {
    return getTransactionsByGroup(groupId);
  },

  addTransaction: async (input) => {
    const timestamp = Date.now();

    const transaction: Transaction = {
      id: generateId(),
      syncId: generateId(),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await createTransactionRecord(transaction);

    set((state) => ({
      transactions: [transaction, ...state.transactions].sort(
        (left, right) => right.createdAt - left.createdAt,
      ),
    }));

    return transaction;
  },

  updateTransaction: async (transactionId, input, userId) => {
    const existing = useTransactionStore
      .getState()
      .transactions.find((transaction) => transaction.id === transactionId)
      ?? (await getAllTransactions()).find((transaction) => transaction.id === transactionId);

    if (!existing) {
      throw new Error('Transaction could not be found.');
    }

    if (existing.createdBy !== userId) {
      throw new Error('You can only edit transactions you created.');
    }

    const updatedTransaction: Transaction = {
      ...existing,
      ...input,
      id: existing.id,
      syncId: existing.syncId,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: Date.now(),
    };

    await upsertTransactionRecord(updatedTransaction);
    const updated = await getAllTransactions();
    set({ transactions: updated });
    return updatedTransaction;
  },

  replaceTransactions: async (transactions) => {
    await replaceAllTransactions(transactions);
    set({
      transactions: [...transactions].sort((left, right) => right.createdAt - left.createdAt),
    });
  },

  upsertTombstones: async (tombstones) => {
    if (tombstones.length === 0) {
      return;
    }

    await upsertTransactionTombstonesInDb(tombstones);
    set((state) => ({
      tombstones: mergeTombstones(state.tombstones, tombstones),
    }));
  },

  upsertTransactions: async (transactions) => {
    for (const transaction of transactions) {
      await upsertTransactionRecord(transaction);
    }

    const updated = await getAllTransactions();
    set({ transactions: updated });
  },

  countTransactionsInGroup: async (groupId) => {
    return countTransactionsByGroup(groupId);
  },

  moveTransactionsToGroup: async (sourceGroupId, targetGroupId) => {
    await moveTransactionsToGroupInDb(sourceGroupId, targetGroupId);
    const updated = await getAllTransactions();
    set({ transactions: updated });
  },

  deleteTransaction: async (transactionId, userId) => {
    const deletedMeta = await deleteTransactionRecord(transactionId, userId);
    if (!deletedMeta) {
      throw new Error('You can only delete transactions you created.');
    }

    const tombstone: TransactionTombstone = {
      syncId: deletedMeta.syncId,
      groupId: deletedMeta.groupId,
      deletedBy: userId,
      deletedAt: Date.now(),
    };

    await upsertTransactionTombstonesInDb([tombstone]);

    const [updated, tombstones] = await Promise.all([
      getAllTransactions(),
      getAllTransactionTombstones(),
    ]);
    set({ transactions: updated, tombstones });
  },

  deleteTransactionsByGroup: async (groupId, deletedBy) => {
    const deletionResult = await deleteTransactionsByGroupInDb(groupId);

    const timestamp = Date.now();
    const tombstones = deletionResult.deletedTransactions.map((transaction) => ({
      syncId: transaction.syncId,
      groupId: transaction.groupId,
      deletedBy,
      deletedAt: timestamp,
    }));

    if (tombstones.length > 0) {
      await upsertTransactionTombstonesInDb(tombstones);
    }

    const [updated, persistedTombstones] = await Promise.all([
      getAllTransactions(),
      getAllTransactionTombstones(),
    ]);
    set({ transactions: updated, tombstones: persistedTombstones });
    return deletionResult.deletedCount;
  },
}));
