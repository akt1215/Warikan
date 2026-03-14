import { useMemo } from 'react';

import type { Transaction } from '../types';
import { calculateBalanceSummary } from '../services';

export const useBalance = (
  userId: string | null,
  transactions: ReadonlyArray<Pick<Transaction, 'payerId' | 'splits'>>,
) => {
  return useMemo(() => {
    if (!userId) {
      return {
        perPerson: {},
        totalOwedByYou: 0,
        totalOwedToYou: 0,
      };
    }

    return calculateBalanceSummary(userId, transactions);
  }, [userId, transactions]);
};
