import type { TransactionTombstone } from '../../types';
import { getDatabase } from './database';

interface TransactionTombstoneRow {
  syncId: string;
  groupId: string;
  deletedAt: number;
  deletedBy: string;
}

const toTransactionTombstone = (
  row: TransactionTombstoneRow,
): TransactionTombstone => ({
  syncId: row.syncId,
  groupId: row.groupId,
  deletedAt: row.deletedAt,
  deletedBy: row.deletedBy,
});

export const getAllTransactionTombstones = async (): Promise<TransactionTombstone[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TransactionTombstoneRow>(
    `SELECT syncId, groupId, deletedAt, deletedBy
     FROM transaction_tombstones
     ORDER BY deletedAt DESC`,
  );

  return rows.map(toTransactionTombstone);
};

export const upsertTransactionTombstones = async (
  tombstones: ReadonlyArray<TransactionTombstone>,
): Promise<void> => {
  if (tombstones.length === 0) {
    return;
  }

  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const tombstone of tombstones) {
      await database.runAsync(
        `INSERT INTO transaction_tombstones (syncId, groupId, deletedAt, deletedBy)
         VALUES ($syncId, $groupId, $deletedAt, $deletedBy)
         ON CONFLICT(syncId) DO UPDATE SET
           groupId = excluded.groupId,
           deletedAt = excluded.deletedAt,
           deletedBy = excluded.deletedBy`,
        {
          $syncId: tombstone.syncId,
          $groupId: tombstone.groupId,
          $deletedAt: tombstone.deletedAt,
          $deletedBy: tombstone.deletedBy,
        },
      );
    }
  });
};
