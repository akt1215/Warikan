import { convertToBaseCurrency, getAverageRate } from '../src/services/currencyCalculator';
import type { CurrencyAcquisition } from '../src/types';

describe('currencyCalculator', () => {
  test('calculates weighted average acquisition rate', () => {
    const acquisitions = [
      { amount: 1000, paidAmount: 10 },
      { amount: 1000, paidAmount: 8 },
    ];

    const averageRate = getAverageRate(acquisitions);

    expect(averageRate).not.toBeNull();
    expect(averageRate ?? 0).toBeCloseTo(111.11, 2);
  });

  test('converts using weighted average before market rate', () => {
    const acquisitions: CurrencyAcquisition[] = [
      {
        id: 'acq-1',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 10,
        rate: 100,
        acquiredAt: Date.now(),
      },
      {
        id: 'acq-2',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 8,
        rate: 125,
        acquiredAt: Date.now(),
      },
    ];

    const converted = convertToBaseCurrency({
      amount: 3000,
      fee: 0,
      fromCurrency: 'JPY',
      baseCurrency: 'USD',
      acquisitions,
      marketRate: 150,
    });

    expect(converted).toBeCloseTo(27, 0);
  });

  test('falls back to market rate when no acquisitions exist', () => {
    const converted = convertToBaseCurrency({
      amount: 3000,
      fee: 0,
      fromCurrency: 'JPY',
      baseCurrency: 'USD',
      acquisitions: [],
      marketRate: 150,
    });

    expect(converted).toBeCloseTo(20, 4);
  });

  test('uses payer-specific acquisitions when acquisition owner is provided', () => {
    const acquisitions: CurrencyAcquisition[] = [
      {
        id: 'acq-user-1',
        userId: 'user-1',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 10,
        rate: 100,
        acquiredAt: Date.now(),
      },
      {
        id: 'acq-user-2',
        userId: 'user-2',
        currency: 'JPY',
        amount: 1000,
        paidAmount: 20,
        rate: 50,
        acquiredAt: Date.now(),
      },
    ];

    const converted = convertToBaseCurrency({
      amount: 1000,
      fee: 0,
      fromCurrency: 'JPY',
      baseCurrency: 'USD',
      acquisitions,
      acquisitionOwnerId: 'user-2',
      marketRate: 150,
    });

    expect(converted).toBeCloseTo(20, 4);
  });
});
