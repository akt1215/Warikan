import { aggregateUsageByPerson, getTotalSpending } from '../src/utils/spendingAnalytics';
import type { Transaction } from '../src/types';

const baseTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'transaction-default',
  groupId: 'group-1',
  label: 'Miscellaneous',
  payerId: 'payer-1',
  amount: 100,
  originalCurrency: 'USD',
  fee: 0,
  convertedAmount: 100,
  note: 'Expense',
  splitType: 'equal',
  splits: [{ userId: 'user-2', amount: 50, isPaid: false }],
  createdBy: 'payer-1',
  createdAt: Date.UTC(2026, 4, 5),
  updatedAt: Date.UTC(2026, 4, 5),
  syncId: 'sync-default',
  ...overrides,
});

describe('spendingAnalytics', () => {
  test('allocates equal split usage to both payer and debtor (100 => 50 / 50)', () => {
    const transactions: Transaction[] = [
      baseTransaction({
        id: 'equal-1',
        syncId: 'sync-equal-1',
        payerId: 'alice',
        convertedAmount: 100,
        splits: [{ userId: 'bob', amount: 50, isPaid: false }],
      }),
    ];

    const result = aggregateUsageByPerson(transactions, 'all');

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([
      { personId: 'alice', amount: 50 },
      { personId: 'bob', amount: 50 },
    ]));
    expect(getTotalSpending(result)).toBe(100);
  });

  test('allocates custom split plus payer remainder and filters by month', () => {
    const now = Date.UTC(2026, 4, 20); // 2026-05-20
    const transactions: Transaction[] = [
      baseTransaction({
        id: 'custom-1',
        syncId: 'sync-custom-1',
        payerId: 'alice',
        convertedAmount: 120,
        splitType: 'custom',
        splits: [
          { userId: 'bob', amount: 30, isPaid: false },
          { userId: 'carol', amount: 40, isPaid: false },
        ],
        createdAt: Date.UTC(2026, 4, 3),
      }),
      baseTransaction({
        id: 'custom-2',
        syncId: 'sync-custom-2',
        payerId: 'bob',
        convertedAmount: 80,
        splitType: 'custom',
        splits: [
          { userId: 'alice', amount: 20, isPaid: false },
          { userId: 'carol', amount: 20, isPaid: false },
        ],
        createdAt: Date.UTC(2026, 4, 8),
      }),
      baseTransaction({
        id: 'old-1',
        syncId: 'sync-old-1',
        payerId: 'carol',
        convertedAmount: 200,
        splitType: 'custom',
        splits: [
          { userId: 'alice', amount: 100, isPaid: false },
          { userId: 'bob', amount: 50, isPaid: false },
        ],
        createdAt: Date.UTC(2026, 3, 25),
      }),
    ];

    const result = aggregateUsageByPerson(transactions, 'month', now);
    const usageByPerson = Object.fromEntries(result.map((entry) => [entry.personId, entry.amount]));

    expect(usageByPerson).toEqual({
      alice: 70,
      bob: 70,
      carol: 60,
    });
    expect(getTotalSpending(result)).toBe(200);
  });

  test('includes previous months in all-time mode and ignores non-positive converted totals', () => {
    const transactions: Transaction[] = [
      baseTransaction({
        id: 'all-1',
        syncId: 'sync-all-1',
        payerId: 'alice',
        convertedAmount: 100,
        splits: [{ userId: 'bob', amount: 50, isPaid: false }],
        createdAt: Date.UTC(2026, 4, 3),
      }),
      baseTransaction({
        id: 'all-2',
        syncId: 'sync-all-2',
        payerId: 'bob',
        convertedAmount: 0,
        splits: [{ userId: 'alice', amount: 0, isPaid: false }],
        createdAt: Date.UTC(2026, 4, 4),
      }),
      baseTransaction({
        id: 'all-3',
        syncId: 'sync-all-3',
        payerId: 'carol',
        convertedAmount: 90,
        splitType: 'custom',
        splits: [
          { userId: 'alice', amount: 20, isPaid: false },
          { userId: 'bob', amount: 20, isPaid: false },
        ],
        createdAt: Date.UTC(2026, 3, 12),
      }),
    ];

    const result = aggregateUsageByPerson(transactions, 'all');
    const usageByPerson = Object.fromEntries(result.map((entry) => [entry.personId, entry.amount]));

    expect(usageByPerson).toEqual({
      alice: 70,
      bob: 70,
      carol: 50,
    });
    expect(getTotalSpending(result)).toBe(190);
  });
});
