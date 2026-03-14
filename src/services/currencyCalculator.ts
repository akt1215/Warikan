import Decimal from 'decimal.js';

import type { CurrencyAcquisition } from '../types';

interface AcquisitionForRate {
  amount: number;
  paidAmount: number;
}

export interface ConvertCurrencyInput {
  amount: number;
  fee?: number;
  fromCurrency: string;
  baseCurrency: string;
  acquisitions: ReadonlyArray<CurrencyAcquisition>;
  marketRate?: number | null;
}

export const getAverageRate = (
  acquisitions: ReadonlyArray<AcquisitionForRate>,
): number | null => {
  const validAcquisitions = acquisitions.filter(
    (acquisition) => acquisition.amount > 0 && acquisition.paidAmount > 0,
  );

  if (validAcquisitions.length === 0) {
    return null;
  }

  const totalForeign = validAcquisitions.reduce(
    (total, acquisition) => total.plus(acquisition.amount),
    new Decimal(0),
  );

  const totalPaid = validAcquisitions.reduce(
    (total, acquisition) => total.plus(acquisition.paidAmount),
    new Decimal(0),
  );

  if (totalPaid.lte(0)) {
    return null;
  }

  return totalForeign.div(totalPaid).toNumber();
};

export const calculateAcquisitionRate = (amount: number, paidAmount: number): number => {
  if (amount <= 0 || paidAmount <= 0) {
    throw new Error('Amount and paid amount must be greater than zero.');
  }

  return new Decimal(amount).div(paidAmount).toNumber();
};

export const convertToBaseCurrency = ({
  amount,
  fee = 0,
  fromCurrency,
  baseCurrency,
  acquisitions,
  marketRate,
}: ConvertCurrencyInput): number => {
  const total = new Decimal(amount).plus(fee);

  if (fromCurrency === baseCurrency) {
    return total.toNumber();
  }

  const relevantAcquisitions = acquisitions.filter(
    (acquisition) => acquisition.currency === fromCurrency,
  );

  const averageRate = getAverageRate(relevantAcquisitions);
  const effectiveRate = averageRate ?? marketRate ?? null;

  if (effectiveRate === null || effectiveRate <= 0) {
    throw new Error(
      `No conversion rate available for ${fromCurrency} to ${baseCurrency}.`,
    );
  }

  return total.div(effectiveRate).toNumber();
};
