import { useCallback } from 'react';

import { useCurrencyStore, useUserStore } from '../store';

export const useExchangeRate = () => {
  const user = useUserStore((state) => state.user);
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);

  const getRateToBase = useCallback(
    (foreignCurrency: string): number | null => {
      if (!user) {
        return null;
      }

      return getMarketRate(user.baseCurrency, foreignCurrency);
    },
    [getMarketRate, user],
  );

  return {
    getRateToBase,
  };
};
