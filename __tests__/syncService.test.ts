import { mergeTransactions } from '../src/services/syncService';
import type { Transaction } from '../src/types';

const baseTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'id-default',
  groupId: 'group-1',
  payerId: 'payer-1',
  amount: 100,
  originalCurrency: 'USD',
  fee: 0,
  convertedAmount: 100,
  note: 'Dinner',
  splitType: 'equal',
  splits: [{ userId: 'user-2', amount: 50, isPaid: false }],
  createdBy: 'payer-1',
  createdAt: 100,
  updatedAt: 100,
  syncId: 'sync-default',
  ...overrides,
});

describe('syncService', () => {
  test('deduplicates by syncId and adds new records', () => {
    const local: Transaction[] = [
      baseTransaction({ id: '1', syncId: 'sync-1', updatedAt: 100 }),
      baseTransaction({ id: '2', syncId: 'sync-2', updatedAt: 100 }),
    ];

    const incoming: Transaction[] = [
      baseTransaction({ id: '3', syncId: 'sync-2', updatedAt: 90 }),
      baseTransaction({ id: '4', syncId: 'sync-3', updatedAt: 120 }),
    ];

    const merged = mergeTransactions(local, incoming);

    expect(merged.merged).toHaveLength(3);
    expect(merged.added).toBe(1);
    expect(merged.skipped).toBe(1);
  });

  test('uses last-write-wins on same syncId conflict by updatedAt', () => {
    const local: Transaction[] = [
      baseTransaction({ id: '1', syncId: 'sync-1', note: 'Old', updatedAt: 100 }),
    ];

    const incoming: Transaction[] = [
      baseTransaction({ id: '2', syncId: 'sync-1', note: 'New', updatedAt: 200 }),
    ];

    const merged = mergeTransactions(local, incoming);

    expect(merged.updated).toBe(1);
    expect(merged.merged).toHaveLength(1);
    expect(merged.merged[0]?.note).toBe('New');
  });
});
