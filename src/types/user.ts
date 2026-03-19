import type { CurrencyCode } from './currency';

export interface User {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;
  favoriteCurrencies: CurrencyCode[];
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
}
