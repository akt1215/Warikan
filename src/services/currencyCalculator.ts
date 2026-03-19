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
  acquisitionOwnerId?: string;
  marketRate?: number | null;
}

export interface AppliedRate {
  rateType: 'acquisition' | 'market';
  rateValue: number;
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

export const resolveAppliedRate = ({
  fromCurrency,
  baseCurrency,
  acquisitions,
  acquisitionOwnerId,
  marketRate,
}: Omit<ConvertCurrencyInput, 'amount' | 'fee'>): AppliedRate | null => {
  if (fromCurrency === baseCurrency) {
    return {
      rateType: 'market',
      rateValue: 1,
    };
  }

  const relevantAcquisitions = acquisitions.filter(
    (acquisition) =>
      acquisition.currency === fromCurrency &&
      (!acquisitionOwnerId || acquisition.userId === acquisitionOwnerId),
  );

  const averageRate = getAverageRate(relevantAcquisitions);
  if (averageRate !== null && averageRate > 0) {
    return {
      rateType: 'acquisition',
      rateValue: averageRate,
    };
  }

  if (typeof marketRate === 'number' && marketRate > 0) {
    return {
      rateType: 'market',
      rateValue: marketRate,
    };
  }

  return null;
};

export const convertToBaseCurrency = ({
  amount,
  fee = 0,
  fromCurrency,
  baseCurrency,
  acquisitions,
  acquisitionOwnerId,
  marketRate,
}: ConvertCurrencyInput): number => {
  const total = new Decimal(amount).plus(fee);

  const resolvedRate = resolveAppliedRate({
    fromCurrency,
    baseCurrency,
    acquisitions,
    acquisitionOwnerId,
    marketRate,
  });
  if (!resolvedRate) {
    throw new Error(
      `No conversion rate available for ${fromCurrency} to ${baseCurrency}.`,
    );
  }

  return total.div(resolvedRate.rateValue).toNumber();
};
