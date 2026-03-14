export type CurrencyCode = string;

export interface CurrencyAcquisition {
  id: string;
  userId: string;
  currency: CurrencyCode;
  amount: number;
  paidAmount: number;
  rate: number;
  acquiredAt: number;
  note?: string;
}

export interface CurrencyAcquisitionInput {
  currency: CurrencyCode;
  amount: number;
  paidAmount: number;
  acquiredAt: number;
  note?: string;
}
