import type { Transaction } from '../types';

export interface BalanceSummary {
  perPerson: Record<string, number>;
  totalOwedByYou: number;
  totalOwedToYou: number;
}

export const calculateBalances = (
  currentUserId: string,
  transactions: ReadonlyArray<Pick<Transaction, 'payerId' | 'splits'>>,
): Record<string, number> => {
  const balances: Record<string, number> = {};

  for (const transaction of transactions) {
    if (transaction.payerId === currentUserId) {
      for (const split of transaction.splits) {
        if (split.userId === currentUserId) {
          continue;
        }

        balances[split.userId] = (balances[split.userId] ?? 0) + split.amount;
      }
      continue;
    }

    const yourSplit = transaction.splits.find(
      (split) => split.userId === currentUserId,
    );

    if (yourSplit) {
      balances[transaction.payerId] =
        (balances[transaction.payerId] ?? 0) - yourSplit.amount;
    }
  }

  return balances;
};

export const calculateBalanceSummary = (
  currentUserId: string,
  transactions: ReadonlyArray<Pick<Transaction, 'payerId' | 'splits'>>,
): BalanceSummary => {
  const perPerson = calculateBalances(currentUserId, transactions);
  const values = Object.values(perPerson);

  const totalOwedByYou = values
    .filter((value) => value < 0)
    .reduce((total, value) => total + Math.abs(value), 0);

  const totalOwedToYou = values
    .filter((value) => value > 0)
    .reduce((total, value) => total + value, 0);

  return {
    perPerson,
    totalOwedByYou,
    totalOwedToYou,
  };
};
