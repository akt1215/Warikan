import { create } from 'zustand';

import type {
  CurrencyAcquisition,
  Group,
  SyncMergeResult,
  Transaction,
  TransactionTombstone,
} from '../types';
import { createSyncPayload, mergeSyncPayload } from '../services';

interface SyncStoreState {
  lastPayload: string | null;
  lastMergeResult: SyncMergeResult | null;
  generatePayload: (
    userId: string,
    transactions: ReadonlyArray<Transaction>,
    sinceTimestamp?: number,
    participantProfiles?: Readonly<Record<string, string>>,
    transactionTombstones?: ReadonlyArray<TransactionTombstone>,
    currencyAcquisitions?: ReadonlyArray<CurrencyAcquisition>,
    groups?: ReadonlyArray<Group>,
  ) => string;
  mergePayload: (
    localTransactions: ReadonlyArray<Transaction>,
    rawPayload: string,
  ) => SyncMergeResult;
}

export const useSyncStore = create<SyncStoreState>((set) => ({
  lastPayload: null,
  lastMergeResult: null,

  generatePayload: (
    userId,
    transactions,
    sinceTimestamp = 0,
    participantProfiles = {},
    transactionTombstones = [],
    currencyAcquisitions = [],
    groups = [],
  ) => {
    const payload = createSyncPayload(
      transactions,
      userId,
      sinceTimestamp,
      participantProfiles,
      transactionTombstones,
      currencyAcquisitions,
      groups,
    );
    set({ lastPayload: payload });
    return payload;
  },

  mergePayload: (localTransactions, rawPayload) => {
    const mergeResult = mergeSyncPayload(localTransactions, rawPayload);
    set({ lastMergeResult: mergeResult });
    return mergeResult;
  },
}));
