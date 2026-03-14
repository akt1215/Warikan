import type { Group, GroupMember } from '../../types';
import { DEFAULT_TRAVEL_GROUPS } from '../../constants';
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

const dedupeMembers = (members: GroupMember[]): GroupMember[] => {
  const map = new Map<string, GroupMember>();

  for (const member of members) {
    if (!member.id || !member.name) {
      continue;
    }

    const existing = map.get(member.id);
    if (!existing || member.joinedAt < existing.joinedAt) {
      map.set(member.id, member);
    }
  }

  return Array.from(map.values());
};

const parseMembers = (raw: string, fallbackJoinedAt: number): GroupMember[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === 'string')
    ) {
      return dedupeMembers(
        parsed.map((item) => ({
          id: item,
          name: item,
          joinedAt: fallbackJoinedAt,
        })),
      );
    }

    if (Array.isArray(parsed)) {
      const members: GroupMember[] = [];

      for (const entry of parsed) {
        if (
          typeof entry === 'object' &&
          entry !== null &&
          'id' in entry &&
          'name' in entry &&
          typeof entry.id === 'string' &&
          typeof entry.name === 'string'
        ) {
          members.push({
            id: entry.id,
            name: entry.name,
            joinedAt:
              'joinedAt' in entry && typeof entry.joinedAt === 'number'
                ? entry.joinedAt
                : fallbackJoinedAt,
          });
        }
      }

      return dedupeMembers(members);
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
  members: parseMembers(row.memberIds, row.createdAt),
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
      $memberIds: JSON.stringify(group.members),
      $createdAt: group.createdAt,
      $updatedAt: group.updatedAt,
    },
  );
};

export const upsertGroupRecord = async (group: Group): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO groups (id, name, isDefault, createdBy, memberIds, createdAt, updatedAt)
     VALUES ($id, $name, $isDefault, $createdBy, $memberIds, $createdAt, $updatedAt)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       isDefault = excluded.isDefault,
       createdBy = excluded.createdBy,
       memberIds = excluded.memberIds,
       createdAt = excluded.createdAt,
       updatedAt = excluded.updatedAt`,
    {
      $id: group.id,
      $name: group.name,
      $isDefault: group.isDefault ? 1 : 0,
      $createdBy: group.createdBy,
      $memberIds: JSON.stringify(group.members),
      $createdAt: group.createdAt,
      $updatedAt: group.updatedAt,
    },
  );
};

export const getGroupsByUser = async (userId: string): Promise<Group[]> => {
  const database = await getDatabase();

  const memberObjectToken = `%"id":"${userId}"%`;
  const memberLegacyToken = `%"${userId}"%`;

  const rows = await database.getAllAsync<GroupRow>(
    `SELECT id, name, isDefault, createdBy, memberIds, createdAt, updatedAt
     FROM groups
     WHERE createdBy = $createdBy
        OR memberIds LIKE $memberObjectToken
        OR memberIds LIKE $memberLegacyToken
     ORDER BY createdAt ASC`,
    {
      $createdBy: userId,
      $memberObjectToken: memberObjectToken,
      $memberLegacyToken: memberLegacyToken,
    },
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

export const createDefaultGroups = async (
  userId: string,
  userName: string,
): Promise<Group[]> => {
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
  const groups: Group[] = DEFAULT_TRAVEL_GROUPS.map((name, index) => ({
    id: generateId(),
    name,
    isDefault: true,
    createdBy: userId,
    members: [
      {
        id: userId,
        name: userName,
        joinedAt: timestamp + index,
      },
    ],
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
