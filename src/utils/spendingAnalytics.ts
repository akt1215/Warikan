import type { Transaction } from '../types';

export type SpendingTimeframe = 'month' | 'all';

export interface PersonUsageTotal {
  personId: string;
  amount: number;
}

const EPSILON = 1e-9;

const getMonthStartTimestamp = (timestamp: number): number => {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};

const isPositiveAmount = (amount: number): boolean => amount > EPSILON;

const addUsage = (totals: Map<string, number>, personId: string, amount: number): void => {
  totals.set(personId, (totals.get(personId) ?? 0) + amount);
};

export const aggregateUsageByPerson = (
  transactions: ReadonlyArray<Transaction>,
  timeframe: SpendingTimeframe,
  currentTimestamp = Date.now(),
): PersonUsageTotal[] => {
  const threshold = timeframe === 'month'
    ? getMonthStartTimestamp(currentTimestamp)
    : Number.NEGATIVE_INFINITY;
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    const transactionTimestamp = transaction.occurredAt || transaction.createdAt;
    if (
      transactionTimestamp < threshold ||
      !isPositiveAmount(transaction.convertedAmount)
    ) {
      continue;
    }

    let allocatedSplitTotal = 0;
    for (const split of transaction.splits) {
      if (!isPositiveAmount(split.amount)) {
        continue;
      }

      allocatedSplitTotal += split.amount;
      addUsage(totals, split.userId, split.amount);
    }

    const payerUsage = transaction.convertedAmount - allocatedSplitTotal;
    if (isPositiveAmount(payerUsage)) {
      addUsage(totals, transaction.payerId, payerUsage);
    }
  }

  return Array.from(totals.entries())
    .map(([personId, amount]) => ({ personId, amount }))
    .sort((left, right) => right.amount - left.amount);
};

export const getTotalSpending = (entries: ReadonlyArray<{ amount: number }>): number => {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
};
