import type { User } from '../../types';
import { getDatabase } from './database';

interface UserRow {
  id: string;
  name: string;
  baseCurrency: string;
  favoriteCurrencies: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
}

const parseFavoriteCurrencies = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')) {
      return Array.from(new Set(parsed.map((entry) => entry.trim()).filter(Boolean)));
    }
  } catch {
    return [];
  }

  return [];
};

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  baseCurrency: row.baseCurrency,
  favoriteCurrencies: parseFavoriteCurrencies(row.favoriteCurrencies),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  lastSyncedAt: row.lastSyncedAt,
});

export const getLocalUser = async (): Promise<User | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<UserRow>(
    `SELECT id, name, baseCurrency, favoriteCurrencies, createdAt, updatedAt, lastSyncedAt
     FROM users
     ORDER BY createdAt ASC
     LIMIT 1`,
  );

  return row ? toUser(row) : null;
};

export const createLocalUser = async (user: User): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO users (id, name, baseCurrency, favoriteCurrencies, createdAt, updatedAt, lastSyncedAt)
     VALUES ($id, $name, $baseCurrency, $favoriteCurrencies, $createdAt, $updatedAt, $lastSyncedAt)`,
    {
      $id: user.id,
      $name: user.name,
      $baseCurrency: user.baseCurrency,
      $favoriteCurrencies: JSON.stringify(user.favoriteCurrencies),
      $createdAt: user.createdAt,
      $updatedAt: user.updatedAt,
      $lastSyncedAt: user.lastSyncedAt,
    },
  );
};

export const updateLocalUser = async (user: User): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE users
     SET name = $name,
         baseCurrency = $baseCurrency,
         favoriteCurrencies = $favoriteCurrencies,
         updatedAt = $updatedAt,
         lastSyncedAt = $lastSyncedAt
     WHERE id = $id`,
    {
      $id: user.id,
      $name: user.name,
      $baseCurrency: user.baseCurrency,
      $favoriteCurrencies: JSON.stringify(user.favoriteCurrencies),
      $updatedAt: user.updatedAt,
      $lastSyncedAt: user.lastSyncedAt,
    },
  );
};
