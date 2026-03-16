export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'BAM'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const isSupportedCurrency = (currency: string): currency is SupportedCurrency =>
  SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);

export const formatCurrencyLabel = (currency: string): string => currency;
