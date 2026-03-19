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
  createdAt: number;
  updatedAt: number;
  syncId: string;
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
}

export type TransactionEditableInput = Omit<TransactionInput, 'createdBy'>;
