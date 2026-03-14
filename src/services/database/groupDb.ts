import type { Group } from '../../types';
import { DEFAULT_GROUPS } from '../../constants';
import { generateId } from '../../utils';
import { getDatabase } from './database';

interface GroupRow {
  id: string;
  name: string;
  isDefault: number;
  createdBy: string;
  memberIds: string;
  createdAt: number;
  updatedAt: number;
}

const parseMemberIds = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    return [];
  }

  return [];
};

const toGroup = (row: GroupRow): Group => ({
  id: row.id,
  name: row.name,
  isDefault: row.isDefault === 1,
  createdBy: row.createdBy,
  memberIds: parseMemberIds(row.memberIds),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createGroupRecord = async (group: Group): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO groups (id, name, isDefault, createdBy, memberIds, createdAt, updatedAt)
     VALUES ($id, $name, $isDefault, $createdBy, $memberIds, $createdAt, $updatedAt)`,
    {
      $id: group.id,
      $name: group.name,
      $isDefault: group.isDefault ? 1 : 0,
      $createdBy: group.createdBy,
      $memberIds: JSON.stringify(group.memberIds),
      $createdAt: group.createdAt,
      $updatedAt: group.updatedAt,
    },
  );
};

export const getGroupsByUser = async (userId: string): Promise<Group[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<GroupRow>(
    `SELECT id, name, isDefault, createdBy, memberIds, createdAt, updatedAt
     FROM groups
     WHERE createdBy = $createdBy
     ORDER BY createdAt ASC`,
    { $createdBy: userId },
  );

  return rows.map(toGroup);
};

export const getGroupById = async (groupId: string): Promise<Group | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<GroupRow>(
    `SELECT id, name, isDefault, createdBy, memberIds, createdAt, updatedAt
     FROM groups
     WHERE id = $id`,
    { $id: groupId },
  );

  return row ? toGroup(row) : null;
};

export const createDefaultGroups = async (userId: string): Promise<Group[]> => {
  const database = await getDatabase();
  const existing = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM groups
     WHERE createdBy = $createdBy`,
    { $createdBy: userId },
  );

  if ((existing?.count ?? 0) > 0) {
    return getGroupsByUser(userId);
  }

  const timestamp = Date.now();
  const groups: Group[] = DEFAULT_GROUPS.map((name, index) => ({
    id: generateId(),
    name,
    isDefault: true,
    createdBy: userId,
    memberIds: [userId],
    createdAt: timestamp + index,
    updatedAt: timestamp + index,
  }));

  await database.withTransactionAsync(async () => {
    for (const group of groups) {
      await createGroupRecord(group);
    }
  });

  return groups;
};

export const deleteGroupRecord = async (groupId: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM groups WHERE id = $id', { $id: groupId });
};
