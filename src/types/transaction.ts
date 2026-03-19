import type { CurrencyCode } from './currency';

export type SplitType = 'equal' | 'custom';

export interface Split {
  userId: string;
  amount: number;
  isPaid: boolean;
}

export interface Transaction {
  id: string;
  groupId: string;
  label: string;
  payerId: string;
  amount: number;
  originalCurrency: CurrencyCode;
  fee: number;
  convertedAmount: number;
  note: string;
  splitType: SplitType;
  splits: Split[];
  createdBy: string;
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
  syncId: string;
  appliedRateType?: 'acquisition' | 'market';
  appliedRateValue?: number | null;
}

export interface TransactionInput {
  groupId: string;
  label: string;
  payerId: string;
  amount: number;
  originalCurrency: CurrencyCode;
  fee: number;
  convertedAmount: number;
  note: string;
  splitType: SplitType;
  splits: Split[];
  createdBy: string;
  occurredAt: number;
  appliedRateType?: 'acquisition' | 'market';
  appliedRateValue?: number | null;
}

export type TransactionEditableInput = Omit<TransactionInput, 'createdBy'>;
