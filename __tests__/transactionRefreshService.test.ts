import type { CurrencyAcquisition, Transaction } from '../src/types';
import { refreshTransactionsForBalance } from '../src/services/transactionRefreshService';

const buildTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-default',
  groupId: 'group-1',
  label: 'Trip',
  payerId: 'user-1',
  amount: 1000,
  originalCurrency: 'JPY',
  fee: 0,
  convertedAmount: 10,
  note: 'Lunch',
  splitType: 'equal',
  splits: [{ userId: 'user-2', amount: 10, isPaid: false }],
  createdBy: 'user-1',
  createdAt: 10,
  updatedAt: 10,
  syncId: 'sync-default',
  ...overrides,
});

describe('transactionRefreshService', () => {
  test('deduplicates by syncId and recalculates converted amount', () => {
    const transactions: Transaction[] = [
      buildTransaction({
        id: 'tx-1',
        syncId: 'sync-1',
        convertedAmount: 12,
        splits: [{ userId: 'user-2', amount: 12, isPaid: false }],
        updatedAt: 100,
      }),
      buildTransaction({
        id: 'tx-2',
        syncId: 'sync-1',
        convertedAmount: 9,
        splits: [{ userId: 'user-2', amount: 9, isPaid: false }],
        updatedAt: 200,
      }),
    ];

    const acquisitions: CurrencyAcquisition[] = [
      {
        id: 'acq-1',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 10,
        rate: 100,
        acquiredAt: 1,
      },
      {
        id: 'acq-2',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 20,
        rate: 50,
        acquiredAt: 2,
      },
    ];

    const result = refreshTransactionsForBalance({
      transactions,
      baseCurrency: 'USD',
      acquisitions,
      getMarketRate: () => null,
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.dedupedCount).toBe(1);
    expect(result.recalculatedCount).toBe(1);
    expect(result.transactions[0]?.convertedAmount).toBeCloseTo(15, 4);
    expect(result.transactions[0]?.splits[0]?.amount).toBeCloseTo(15, 4);
  });

  test('rescales custom splits using refreshed conversion', () => {
    const transactions: Transaction[] = [
      buildTransaction({
        id: 'tx-custom',
        syncId: 'sync-custom',
        originalCurrency: 'EUR',
        amount: 100,
        convertedAmount: 40,
        splitType: 'custom',
        splits: [
          { userId: 'user-2', amount: 10, isPaid: false },
          { userId: 'user-3', amount: 30, isPaid: false },
        ],
      }),
    ];

    const result = refreshTransactionsForBalance({
      transactions,
      baseCurrency: 'USD',
      acquisitions: [],
      getMarketRate: (_baseCurrency, foreignCurrency) =>
        foreignCurrency === 'EUR' ? 2 : null,
    });

    expect(result.dedupedCount).toBe(0);
    expect(result.recalculatedCount).toBe(1);
    expect(result.transactions[0]?.convertedAmount).toBeCloseTo(50, 4);
    expect(result.transactions[0]?.splits[0]?.amount).toBeCloseTo(12.5, 4);
    expect(result.transactions[0]?.splits[1]?.amount).toBeCloseTo(37.5, 4);
  });

  test('recalculates with average acquisition rate even without duplicates', () => {
    const transactions: Transaction[] = [
      buildTransaction({
        id: 'tx-avg',
        syncId: 'sync-avg',
        amount: 2000,
        convertedAmount: 20,
        splits: [{ userId: 'user-2', amount: 20, isPaid: false }],
      }),
    ];

    const acquisitions: CurrencyAcquisition[] = [
      {
        id: 'acq-1',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 10,
        rate: 100,
        acquiredAt: 1,
      },
      {
        id: 'acq-2',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 40,
        rate: 25,
        acquiredAt: 2,
      },
    ];

    const result = refreshTransactionsForBalance({
      transactions,
      baseCurrency: 'USD',
      acquisitions,
      getMarketRate: () => null,
    });

    expect(result.dedupedCount).toBe(0);
    expect(result.processedCount).toBe(1);
    expect(result.recalculatedCount).toBe(1);
    expect(result.transactions[0]?.convertedAmount).toBeCloseTo(50, 4);
    expect(result.transactions[0]?.splits[0]?.amount).toBeCloseTo(50, 4);
  });

  test('recalculates using payer-specific acquisitions', () => {
    const transactions: Transaction[] = [
      buildTransaction({
        id: 'tx-payer-specific',
        syncId: 'sync-payer-specific',
        payerId: 'user-2',
        amount: 1000,
        convertedAmount: 10,
        splits: [{ userId: 'user-1', amount: 10, isPaid: false }],
      }),
    ];

    const acquisitions: CurrencyAcquisition[] = [
      {
        id: 'acq-user-1',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 10,
        rate: 100,
        acquiredAt: 1,
      },
      {
        id: 'acq-user-2',
        userId: 'user-2',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 20,
        rate: 50,
        acquiredAt: 2,
      },
    ];

    const result = refreshTransactionsForBalance({
      transactions,
      baseCurrency: 'USD',
      acquisitions,
      getMarketRate: () => 150,
    });

    expect(result.recalculatedCount).toBe(1);
    expect(result.transactions[0]?.convertedAmount).toBeCloseTo(20, 4);
    expect(result.transactions[0]?.splits[0]?.amount).toBeCloseTo(20, 4);
  });
});
