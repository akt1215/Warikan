import type { CurrencyCode } from './currency';

export interface ExchangeRate {
  currency: CurrencyCode;
  rateToBase: number;
  updatedAt: number;
}

export interface ExchangeRateResponse {
  base: CurrencyCode;
  date: string;
  rates: Record<string, number>;
}
