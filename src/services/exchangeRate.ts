import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ExchangeRateResponse } from '../types';

const CACHE_PREFIX = 'warikan:exchangeRates:';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

interface ExchangeRateCache {
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isExchangeRateResponse = (value: unknown): value is ExchangeRateResponse => {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.base !== 'string' || typeof value.date !== 'string') {
    return false;
  }

  if (!isRecord(value.rates)) {
    return false;
  }

  return Object.values(value.rates).every((rate) => typeof rate === 'number');
};

const getCacheKey = (baseCurrency: string): string => `${CACHE_PREFIX}${baseCurrency}`;

const readCache = async (baseCurrency: string): Promise<ExchangeRateCache | null> => {
  const raw = await AsyncStorage.getItem(getCacheKey(baseCurrency));
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    if (
      typeof parsed.base !== 'string' ||
      !isRecord(parsed.rates) ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }

    const ratesEntries = Object.entries(parsed.rates).filter(
      ([, value]) => typeof value === 'number',
    ) as [string, number][];

    return {
      base: parsed.base,
      rates: Object.fromEntries(ratesEntries),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
};

const writeCache = async (cache: ExchangeRateCache): Promise<void> => {
  await AsyncStorage.setItem(getCacheKey(cache.base), JSON.stringify(cache));
};

export const fetchExchangeRates = async (
  baseCurrency: string,
): Promise<Record<string, number>> => {
  const cached = await readCache(baseCurrency);
  const now = Date.now();

  if (cached && now - cached.updatedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  const endpoint = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}.`);
    }

    const json: unknown = await response.json();
    if (!isExchangeRateResponse(json)) {
      throw new Error('Exchange rate API returned unexpected response format.');
    }

    const cache: ExchangeRateCache = {
      base: baseCurrency,
      rates: json.rates,
      updatedAt: now,
    };

    await writeCache(cache);
    return json.rates;
  } catch (error) {
    if (cached) {
      return cached.rates;
    }

    throw error;
  }
};

export const getMarketRateForConversion = (
  baseCurrency: string,
  foreignCurrency: string,
  rates: Record<string, number>,
): number | null => {
  if (foreignCurrency === baseCurrency) {
    return 1;
  }

  const rate = rates[foreignCurrency];
  if (typeof rate !== 'number' || rate <= 0) {
    return null;
  }

  return rate;
};
