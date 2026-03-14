import type { Transaction } from '../types';

export interface FirebaseSyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
}

class FirebaseServiceStub {
  readonly enabled = false;

  async pushTransactions(_transactions: ReadonlyArray<Transaction>): Promise<FirebaseSyncResult> {
    return {
      success: false,
      message: 'Firebase sync is not configured. This is a local stub.',
      syncedCount: 0,
    };
  }

  async pullTransactions(): Promise<ReadonlyArray<Transaction>> {
    return [];
  }
}

export const firebaseService = new FirebaseServiceStub();
