import { create } from 'zustand';

import type { SyncMergeResult, Transaction } from '../types';
import { createSyncPayload, mergeSyncPayload } from '../services';

interface SyncStoreState {
  lastPayload: string | null;
  lastMergeResult: SyncMergeResult | null;
  generatePayload: (
    userId: string,
    transactions: ReadonlyArray<Transaction>,
    sinceTimestamp?: number,
  ) => string;
  mergePayload: (
    localTransactions: ReadonlyArray<Transaction>,
    rawPayload: string,
  ) => SyncMergeResult;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  lastPayload: null,
  lastMergeResult: null,

  generatePayload: (userId, transactions, sinceTimestamp = 0) => {
    const payload = createSyncPayload(transactions, userId, sinceTimestamp);
    set({ lastPayload: payload });
    return payload;
  },

  mergePayload: (localTransactions, rawPayload) => {
    const mergeResult = mergeSyncPayload(localTransactions, rawPayload);
    set({ lastMergeResult: mergeResult });
    return mergeResult;
  },
}));
