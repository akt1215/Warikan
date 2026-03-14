export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'BAM'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  BAM: 'Bosnia and Herzegovina Convertible Mark',
};
