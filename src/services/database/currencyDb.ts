import type { CurrencyAcquisition } from '../../types';
import { getDatabase } from './database';

interface CurrencyAcquisitionRow {
  id: string;
  userId: string;
  currency: string;
  amount: number;
  paidAmount: number;
  rate: number;
  acquiredAt: number;
  note: string | null;
}

const toCurrencyAcquisition = (row: CurrencyAcquisitionRow): CurrencyAcquisition => ({
  id: row.id,
  userId: row.userId,
  currency: row.currency,
  amount: row.amount,
  paidAmount: row.paidAmount,
  rate: row.rate,
  acquiredAt: row.acquiredAt,
  note: row.note ?? undefined,
});

export const createCurrencyAcquisitionRecord = async (
  acquisition: CurrencyAcquisition,
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO currency_acquisitions (id, userId, currency, amount, paidAmount, rate, acquiredAt, note)
     VALUES ($id, $userId, $currency, $amount, $paidAmount, $rate, $acquiredAt, $note)`,
    {
      $id: acquisition.id,
      $userId: acquisition.userId,
      $currency: acquisition.currency,
      $amount: acquisition.amount,
      $paidAmount: acquisition.paidAmount,
      $rate: acquisition.rate,
      $acquiredAt: acquisition.acquiredAt,
      $note: acquisition.note ?? null,
    },
  );
};

export const getCurrencyAcquisitionsByUser = async (
  userId: string,
): Promise<CurrencyAcquisition[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CurrencyAcquisitionRow>(
    `SELECT id, userId, currency, amount, paidAmount, rate, acquiredAt, note
     FROM currency_acquisitions
     WHERE userId = $userId
     ORDER BY acquiredAt DESC`,
    { $userId: userId },
  );

  return rows.map(toCurrencyAcquisition);
};

export const getAllCurrencyAcquisitions = async (): Promise<CurrencyAcquisition[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CurrencyAcquisitionRow>(
    `SELECT id, userId, currency, amount, paidAmount, rate, acquiredAt, note
     FROM currency_acquisitions
     ORDER BY acquiredAt DESC`,
  );

  return rows.map(toCurrencyAcquisition);
};

export const getCurrencyAcquisitionsByCurrency = async (
  userId: string,
  currency: string,
): Promise<CurrencyAcquisition[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CurrencyAcquisitionRow>(
    `SELECT id, userId, currency, amount, paidAmount, rate, acquiredAt, note
     FROM currency_acquisitions
     WHERE userId = $userId AND currency = $currency
     ORDER BY acquiredAt DESC`,
    {
      $userId: userId,
      $currency: currency,
    },
  );

  return rows.map(toCurrencyAcquisition);
};

export const deleteCurrencyAcquisitionRecord = async (
  acquisitionId: string,
  userId: string,
): Promise<boolean> => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM currency_acquisitions
     WHERE id = $id AND userId = $userId`,
    {
      $id: acquisitionId,
      $userId: userId,
    },
  );

  return result.changes > 0;
};

export const replaceCurrencyAcquisitionsForUser = async (
  userId: string,
  acquisitions: ReadonlyArray<CurrencyAcquisition>,
): Promise<void> => {
  const database = await getDatabase();
  const normalizedUserId = userId.trim();
  const userAcquisitions = acquisitions.filter(
    (acquisition) => acquisition.userId === normalizedUserId,
  );

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `DELETE FROM currency_acquisitions
       WHERE userId = $userId`,
      { $userId: normalizedUserId },
    );

    for (const acquisition of userAcquisitions) {
      await database.runAsync(
        `INSERT INTO currency_acquisitions (id, userId, currency, amount, paidAmount, rate, acquiredAt, note)
         VALUES ($id, $userId, $currency, $amount, $paidAmount, $rate, $acquiredAt, $note)`,
        {
          $id: acquisition.id,
          $userId: acquisition.userId,
          $currency: acquisition.currency,
          $amount: acquisition.amount,
          $paidAmount: acquisition.paidAmount,
          $rate: acquisition.rate,
          $acquiredAt: acquisition.acquiredAt,
          $note: acquisition.note ?? null,
        },
      );
    }
  });
};
