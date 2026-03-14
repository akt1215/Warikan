import { create } from 'zustand';

import type { CurrencyAcquisition, CurrencyAcquisitionInput } from '../types';
import {
  createCurrencyAcquisitionRecord,
  getCurrencyAcquisitionsByUser,
} from '../services/database';
import {
  calculateAcquisitionRate,
  fetchExchangeRates,
  getMarketRateForConversion,
} from '../services';
import { generateId } from '../utils';

interface CurrencyStoreState {
  acquisitions: CurrencyAcquisition[];
  marketRates: Record<string, number>;
  ratesUpdatedAt: number | null;
  isLoading: boolean;
  loadAcquisitions: (userId: string) => Promise<void>;
  addAcquisition: (userId: string, input: CurrencyAcquisitionInput) => Promise<CurrencyAcquisition>;
  refreshMarketRates: (baseCurrency: string) => Promise<Record<string, number>>;
  getMarketRate: (baseCurrency: string, foreignCurrency: string) => number | null;
}

export const useCurrencyStore = create<CurrencyStoreState>((set, get) => ({
  acquisitions: [],
  marketRates: {},
  ratesUpdatedAt: null,
  isLoading: false,

  loadAcquisitions: async (userId) => {
    set({ isLoading: true });

    try {
      const acquisitions = await getCurrencyAcquisitionsByUser(userId);
      set({ acquisitions });
    } finally {
      set({ isLoading: false });
    }
  },

  addAcquisition: async (userId, input) => {
    const acquisition: CurrencyAcquisition = {
      id: generateId(),
      userId,
      currency: input.currency,
      amount: input.amount,
      paidAmount: input.paidAmount,
      rate: calculateAcquisitionRate(input.amount, input.paidAmount),
      acquiredAt: input.acquiredAt,
      note: input.note,
    };

    await createCurrencyAcquisitionRecord(acquisition);

    set((state) => ({
      acquisitions: [acquisition, ...state.acquisitions].sort(
        (left, right) => right.acquiredAt - left.acquiredAt,
      ),
    }));

    return acquisition;
  },

  refreshMarketRates: async (baseCurrency) => {
    const marketRates = await fetchExchangeRates(baseCurrency);
    set({ marketRates, ratesUpdatedAt: Date.now() });
    return marketRates;
  },

  getMarketRate: (baseCurrency, foreignCurrency) => {
    return getMarketRateForConversion(baseCurrency, foreignCurrency, get().marketRates);
  },
}));
