import type { CurrencyAcquisition } from './currency';
import type { Transaction } from './transaction';

export interface TransactionTombstone {
  syncId: string;
  groupId: string;
  deletedAt: number;
  deletedBy: string;
}

export interface SyncPayload {
  version: 1;
  generatedAt: number;
  generatedBy: string;
  transactions: Transaction[];
  currencyAcquisitions?: CurrencyAcquisition[];
  participantProfiles?: Record<string, string>;
  transactionTombstones?: TransactionTombstone[];
}

export interface SyncMergeResult {
  merged: Transaction[];
  added: number;
  updated: number;
  skipped: number;
}
