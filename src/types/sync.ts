import type { Transaction } from './transaction';

export interface SyncPayload {
  version: 1;
  generatedAt: number;
  generatedBy: string;
  transactions: Transaction[];
}

export interface SyncMergeResult {
  merged: Transaction[];
  added: number;
  updated: number;
  skipped: number;
}
