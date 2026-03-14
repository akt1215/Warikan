import type { User } from '../../types';
import { getDatabase } from './database';

interface UserRow {
  id: string;
  name: string;
  baseCurrency: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  baseCurrency: row.baseCurrency,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  lastSyncedAt: row.lastSyncedAt,
});

export const getLocalUser = async (): Promise<User | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<UserRow>(
    'SELECT id, name, baseCurrency, createdAt, updatedAt, lastSyncedAt FROM users ORDER BY createdAt ASC LIMIT 1',
  );

  return row ? toUser(row) : null;
};

export const createLocalUser = async (user: User): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO users (id, name, baseCurrency, createdAt, updatedAt, lastSyncedAt)
     VALUES ($id, $name, $baseCurrency, $createdAt, $updatedAt, $lastSyncedAt)`,
    {
      $id: user.id,
      $name: user.name,
      $baseCurrency: user.baseCurrency,
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
         updatedAt = $updatedAt,
         lastSyncedAt = $lastSyncedAt
     WHERE id = $id`,
    {
      $id: user.id,
      $name: user.name,
      $baseCurrency: user.baseCurrency,
      $updatedAt: user.updatedAt,
      $lastSyncedAt: user.lastSyncedAt,
    },
  );
};
