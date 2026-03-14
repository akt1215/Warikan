import { create } from 'zustand';

import type { CurrencyAcquisition, CurrencyAcquisitionInput } from '../types';
import {
  createCurrencyAcquisitionRecord,
  deleteCurrencyAcquisitionRecord,
  getAllCurrencyAcquisitions,
  getCurrencyAcquisitionsByUser,
  replaceCurrencyAcquisitionsForUser,
} from '../services/database';
import {
  calculateAcquisitionRate,
  fetchExchangeRates,
  getMarketRateForConversion,
} from '../services';
import { generateId } from '../utils';

interface CurrencyStoreState {
  acquisitions: CurrencyAcquisition[];
  allAcquisitions: CurrencyAcquisition[];
  marketRates: Record<string, number>;
  ratesUpdatedAt: number | null;
  isLoading: boolean;
  loadAcquisitions: (userId: string) => Promise<void>;
  addAcquisition: (userId: string, input: CurrencyAcquisitionInput) => Promise<CurrencyAcquisition>;
  deleteAcquisition: (userId: string, acquisitionId: string) => Promise<void>;
  replaceSyncedUserAcquisitions: (
    currentUserId: string,
    syncedUserId: string,
    acquisitions: ReadonlyArray<CurrencyAcquisition>,
  ) => Promise<void>;
  refreshMarketRates: (baseCurrency: string) => Promise<Record<string, number>>;
  getMarketRate: (baseCurrency: string, foreignCurrency: string) => number | null;
}

export const useCurrencyStore = create<CurrencyStoreState>((set, get) => ({
  acquisitions: [],
  allAcquisitions: [],
  marketRates: {},
  ratesUpdatedAt: null,
  isLoading: false,

  loadAcquisitions: async (userId) => {
    set({ isLoading: true });

    try {
      const [acquisitions, allAcquisitions] = await Promise.all([
        getCurrencyAcquisitionsByUser(userId),
        getAllCurrencyAcquisitions(),
      ]);
      set({ acquisitions, allAcquisitions });
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
      allAcquisitions: [acquisition, ...state.allAcquisitions].sort(
        (left, right) => right.acquiredAt - left.acquiredAt,
      ),
    }));

    return acquisition;
  },

  deleteAcquisition: async (userId, acquisitionId) => {
    const deleted = await deleteCurrencyAcquisitionRecord(acquisitionId, userId);
    if (!deleted) {
      throw new Error('You can only delete your own acquisition.');
    }

    const [acquisitions, allAcquisitions] = await Promise.all([
      getCurrencyAcquisitionsByUser(userId),
      getAllCurrencyAcquisitions(),
    ]);
    set({ acquisitions, allAcquisitions });
  },

  replaceSyncedUserAcquisitions: async (currentUserId, syncedUserId, acquisitions) => {
    await replaceCurrencyAcquisitionsForUser(syncedUserId, acquisitions);
    const [currentUserAcquisitions, allAcquisitions] = await Promise.all([
      getCurrencyAcquisitionsByUser(currentUserId),
      getAllCurrencyAcquisitions(),
    ]);
    set({
      acquisitions: currentUserAcquisitions,
      allAcquisitions,
    });
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
