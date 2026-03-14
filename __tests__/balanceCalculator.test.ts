import { calculateBalanceSummary, calculateBalances } from '../src/services/balanceCalculator';

describe('balanceCalculator', () => {
  test('calculates balances for payer in equal split', () => {
    const balances = calculateBalances('user1', [
      {
        payerId: 'user1',
        splits: [
          { userId: 'user2', amount: 33.33, isPaid: false },
          { userId: 'user3', amount: 33.33, isPaid: false },
        ],
      },
    ]);

    expect(balances.user2).toBeCloseTo(33.33, 2);
    expect(balances.user3).toBeCloseTo(33.33, 2);
  });

  test('calculates when current user owes someone else', () => {
    const balances = calculateBalances('user2', [
      {
        payerId: 'user1',
        splits: [
          { userId: 'user2', amount: 25, isPaid: false },
          { userId: 'user3', amount: 25, isPaid: false },
        ],
      },
    ]);

    expect(balances.user1).toBe(-25);
  });

  test('returns summary totals for positive and negative balances', () => {
    const summary = calculateBalanceSummary('user1', [
      {
        payerId: 'user1',
        splits: [{ userId: 'user2', amount: 50, isPaid: false }],
      },
      {
        payerId: 'user3',
        splits: [{ userId: 'user1', amount: 20, isPaid: false }],
      },
    ]);

    expect(summary.totalOwedToYou).toBe(50);
    expect(summary.totalOwedByYou).toBe(20);
  });
});
