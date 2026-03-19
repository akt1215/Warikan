import type { CurrencyAcquisition, Transaction } from '../types';
import { convertToBaseCurrency, resolveAppliedRate } from './currencyCalculator';
import { mergeTransactions } from './syncService';

interface RefreshTransactionsInput {
  transactions: ReadonlyArray<Transaction>;
  baseCurrency: string;
  acquisitions: ReadonlyArray<CurrencyAcquisition>;
  getMarketRate: (baseCurrency: string, foreignCurrency: string) => number | null;
}

export interface RefreshTransactionsResult {
  transactions: Transaction[];
  dedupedCount: number;
  processedCount: number;
  recalculatedCount: number;
}

const EPSILON = 1e-9;

const hasAmountChanged = (left: number, right: number): boolean => {
  return Math.abs(left - right) > EPSILON;
};

const recalculateSplits = (
  transaction: Transaction,
  nextConvertedAmount: number,
): Transaction['splits'] => {
  if (transaction.splits.length === 0) {
    return [];
  }

  if (transaction.splitType === 'equal') {
    const splitAmount = nextConvertedAmount / (transaction.splits.length + 1);
    return transaction.splits.map((split) => ({
      ...split,
      amount: splitAmount,
    }));
  }

  const totalPreviousSplitAmount = transaction.splits.reduce(
    (sum, split) => sum + split.amount,
    0,
  );

  if (transaction.convertedAmount > EPSILON) {
    const scale = nextConvertedAmount / transaction.convertedAmount;
    return transaction.splits.map((split) => ({
      ...split,
      amount: split.amount * scale,
    }));
  }

  if (totalPreviousSplitAmount <= 0) {
    const splitAmount = nextConvertedAmount / transaction.splits.length;
    return transaction.splits.map((split) => ({
      ...split,
      amount: splitAmount,
    }));
  }

  const scale = nextConvertedAmount / totalPreviousSplitAmount;
  return transaction.splits.map((split) => ({
    ...split,
    amount: split.amount * scale,
  }));
};

const hasRelevantAcquisition = (
  transaction: Transaction,
  baseCurrency: string,
  acquisitions: ReadonlyArray<CurrencyAcquisition>,
): boolean => {
  if (transaction.originalCurrency === baseCurrency) {
    return false;
  }

  return acquisitions.some((acquisition) =>
    acquisition.currency === transaction.originalCurrency &&
    acquisition.userId === transaction.payerId &&
    acquisition.amount > 0 &&
    acquisition.paidAmount > 0,
  );
};

const getMarketRateForRefresh = (
  transaction: Transaction,
  baseCurrency: string,
  acquisitions: ReadonlyArray<CurrencyAcquisition>,
  marketRate: number | null,
): number | null => {
  if (
    transaction.appliedRateType === 'market' &&
    typeof transaction.appliedRateValue === 'number' &&
    transaction.appliedRateValue > 0 &&
    !hasRelevantAcquisition(transaction, baseCurrency, acquisitions)
  ) {
    return transaction.appliedRateValue;
  }

  return marketRate;
};

export const refreshTransactionsForBalance = ({
  transactions,
  baseCurrency,
  acquisitions,
  getMarketRate,
}: RefreshTransactionsInput): RefreshTransactionsResult => {
  const dedupedTransactions = mergeTransactions([], transactions).merged;
  const dedupedCount = transactions.length - dedupedTransactions.length;
  const recalculationTimestamp = Date.now();
  let recalculatedCount = 0;

  const refreshedTransactions = dedupedTransactions.map((transaction) => {
    const refreshMarketRate = getMarketRateForRefresh(
      transaction,
      baseCurrency,
      acquisitions,
      getMarketRate(baseCurrency, transaction.originalCurrency),
    );
    const resolvedRate = resolveAppliedRate({
      fromCurrency: transaction.originalCurrency,
      baseCurrency,
      acquisitions,
      acquisitionOwnerId: transaction.payerId,
      marketRate: refreshMarketRate,
    });

    const nextConvertedAmount = convertToBaseCurrency({
      amount: transaction.amount,
      fee: transaction.fee,
      fromCurrency: transaction.originalCurrency,
      baseCurrency,
      acquisitions,
      acquisitionOwnerId: transaction.payerId,
      marketRate: refreshMarketRate,
    });

    const nextSplits = recalculateSplits(transaction, nextConvertedAmount);

    const convertedChanged = hasAmountChanged(
      nextConvertedAmount,
      transaction.convertedAmount,
    );

    const splitsChanged =
      nextSplits.length !== transaction.splits.length ||
      nextSplits.some((split, index) =>
        hasAmountChanged(split.amount, transaction.splits[index]?.amount ?? 0),
      );

    if (!convertedChanged && !splitsChanged) {
      if (
        transaction.appliedRateType === resolvedRate?.rateType &&
        transaction.appliedRateValue === resolvedRate?.rateValue
      ) {
        return transaction;
      }
    }

    recalculatedCount += 1;
    return {
      ...transaction,
      convertedAmount: nextConvertedAmount,
      splits: nextSplits,
      occurredAt: transaction.occurredAt || transaction.createdAt,
      appliedRateType: resolvedRate?.rateType,
      appliedRateValue: resolvedRate?.rateValue ?? null,
      updatedAt: recalculationTimestamp,
    };
  });

  return {
    transactions: refreshedTransactions,
    dedupedCount,
    processedCount: dedupedTransactions.length,
    recalculatedCount,
  };
};
