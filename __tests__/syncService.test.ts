import {
  applyTransactionTombstones,
  createSyncPayload,
  mergeTransactionTombstones,
  mergeTransactions,
  parseSyncPayload,
} from '../src/services/syncService';
import type { Transaction } from '../src/types';

const baseTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'id-default',
  groupId: 'group-1',
  label: 'Dinner',
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

  test('defaults label when parsing legacy payload without label field', () => {
    const payload = JSON.stringify({
      version: 1,
      generatedAt: 200,
      generatedBy: 'user-1',
      transactions: [
        {
          id: 'legacy-1',
          groupId: 'group-1',
          payerId: 'payer-1',
          amount: 100,
          originalCurrency: 'USD',
          fee: 0,
          convertedAmount: 100,
          note: 'Legacy',
          splitType: 'equal',
          splits: [{ userId: 'user-2', amount: 50, isPaid: false }],
          createdBy: 'payer-1',
          createdAt: 100,
          updatedAt: 100,
          syncId: 'legacy-sync-1',
        },
      ],
    });

    const parsed = parseSyncPayload(payload);

    expect(parsed.transactions[0]?.label).toBe('Miscellaneous');
    expect(parsed.participantProfiles).toEqual({});
  });

  test('round-trips participant profiles in sync payload', () => {
    const transactions: Transaction[] = [
      baseTransaction({ id: 'tx-1', syncId: 'sync-1', createdAt: 100, updatedAt: 100 }),
    ];

    const payload = createSyncPayload(
      transactions,
      'user-1',
      0,
      {
        'user-1': 'Akira',
        'user-2': 'Bob',
      },
    );

    const parsed = parseSyncPayload(payload);
    expect(parsed.participantProfiles).toEqual({
      'user-1': 'Akira',
      'user-2': 'Bob',
    });
  });

  test('round-trips tombstones in sync payload', () => {
    const transactions: Transaction[] = [
      baseTransaction({ id: 'tx-1', syncId: 'sync-1', createdAt: 100, updatedAt: 100 }),
    ];

    const payload = createSyncPayload(
      transactions,
      'user-1',
      0,
      {},
      [{
        syncId: 'sync-deleted',
        groupId: 'group-1',
        deletedAt: 500,
        deletedBy: 'user-1',
      }],
    );

    const parsed = parseSyncPayload(payload);
    expect(parsed.transactionTombstones).toEqual([{
      syncId: 'sync-deleted',
      groupId: 'group-1',
      deletedAt: 500,
      deletedBy: 'user-1',
    }]);
  });

  test('round-trips currency acquisitions in sync payload', () => {
    const payload = createSyncPayload(
      [baseTransaction({ id: 'tx-1', syncId: 'sync-1', createdAt: 100, updatedAt: 100 })],
      'user-1',
      0,
      {},
      [],
      [{
        id: 'acq-1',
        userId: 'user-2',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 10,
        rate: 100,
        acquiredAt: 123,
        note: 'Airport exchange',
      }],
    );

    const parsed = parseSyncPayload(payload);
    expect(parsed.currencyAcquisitions).toEqual([{
      id: 'acq-1',
      userId: 'user-2',
      currency: 'JPY',
      amount: 1000,
      paidAmount: 10,
      rate: 100,
      acquiredAt: 123,
      note: 'Airport exchange',
    }]);
  });

  test('applies tombstones when deletion is newer than transaction update', () => {
    const transactions: Transaction[] = [
      baseTransaction({ id: 'tx-1', syncId: 'sync-1', updatedAt: 100 }),
      baseTransaction({ id: 'tx-2', syncId: 'sync-2', updatedAt: 300 }),
    ];

    const filtered = applyTransactionTombstones(transactions, [{
      syncId: 'sync-1',
      groupId: 'group-1',
      deletedAt: 200,
      deletedBy: 'user-1',
    }]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.syncId).toBe('sync-2');
  });

  test('keeps transaction when tombstone is older than latest update', () => {
    const transactions: Transaction[] = [
      baseTransaction({ id: 'tx-2', syncId: 'sync-2', updatedAt: 300 }),
    ];

    const filtered = applyTransactionTombstones(transactions, [{
      syncId: 'sync-2',
      groupId: 'group-1',
      deletedAt: 200,
      deletedBy: 'user-1',
    }]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.syncId).toBe('sync-2');
  });

  test('merges tombstones by newest deletedAt per syncId', () => {
    const merged = mergeTransactionTombstones(
      [{
        syncId: 'sync-1',
        groupId: 'group-1',
        deletedAt: 100,
        deletedBy: 'user-1',
      }],
      [{
        syncId: 'sync-1',
        groupId: 'group-1',
        deletedAt: 200,
        deletedBy: 'user-2',
      }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.deletedAt).toBe(200);
    expect(merged[0]?.deletedBy).toBe('user-2');
  });
});
