import { create } from 'zustand';

import type { Transaction, TransactionInput } from '../types';
import {
  createTransactionRecord,
  getAllTransactions,
  getTransactionsByGroup,
  replaceAllTransactions,
  upsertTransactionRecord,
} from '../services/database';
import { generateId } from '../utils';

interface TransactionStoreState {
  transactions: Transaction[];
  isLoading: boolean;
  loadTransactions: () => Promise<void>;
  loadTransactionsByGroup: (groupId: string) => Promise<Transaction[]>;
  addTransaction: (input: TransactionInput) => Promise<Transaction>;
  replaceTransactions: (transactions: Transaction[]) => Promise<void>;
  upsertTransactions: (transactions: Transaction[]) => Promise<void>;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  transactions: [],
  isLoading: false,

  loadTransactions: async () => {
    set({ isLoading: true });

    try {
      const transactions = await getAllTransactions();
      set({ transactions });
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

  replaceTransactions: async (transactions) => {
    await replaceAllTransactions(transactions);
    set({
      transactions: [...transactions].sort((left, right) => right.createdAt - left.createdAt),
    });
  },

  upsertTransactions: async (transactions) => {
    for (const transaction of transactions) {
      await upsertTransactionRecord(transaction);
    }

    const updated = await getAllTransactions();
    set({ transactions: updated });
  },
}));
