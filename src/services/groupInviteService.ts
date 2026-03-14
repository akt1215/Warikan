import type { Group, GroupMember } from '../types';

const INVITE_PREFIX = 'WKG1';

interface GroupInvitePayload {
  version: 1;
  type: 'group-invite';
  generatedAt: number;
  group: {
    id: string;
    name: string;
    createdBy: string;
    members: GroupMember[];
  };
}

export interface GroupInviteData {
  id: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizeMembers = (members: ReadonlyArray<GroupMember>): GroupMember[] => {
  const deduped = new Map<string, GroupMember>();

  for (const member of members) {
    const id = member.id.trim();
    const name = member.name.trim();
    if (!id || !name) {
      continue;
    }

    const existing = deduped.get(id);
    const normalized: GroupMember = {
      id,
      name,
      joinedAt: Number.isFinite(member.joinedAt) ? member.joinedAt : Date.now(),
    };

    if (!existing) {
      deduped.set(id, normalized);
      continue;
    }

    deduped.set(id, {
      id,
      name: normalized.name || existing.name,
      joinedAt: Math.min(existing.joinedAt, normalized.joinedAt),
    });
  }

  return Array.from(deduped.values());
};

const parseMembersFromUnknown = (value: unknown): GroupMember[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const members: GroupMember[] = [];
  for (const entry of value) {
    if (
      isRecord(entry) &&
      typeof entry.id === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.joinedAt === 'number'
    ) {
      members.push({
        id: entry.id,
        name: entry.name,
        joinedAt: entry.joinedAt,
      });
      continue;
    }

    if (
      isRecord(entry) &&
      typeof entry.id === 'string' &&
      typeof entry.name === 'string'
    ) {
      members.push({
        id: entry.id,
        name: entry.name,
        joinedAt: Date.now(),
      });
    }
  }

  return normalizeMembers(members);
};

const toPayload = (group: Group): GroupInvitePayload => {
  return {
    version: 1,
    type: 'group-invite',
    generatedAt: Date.now(),
    group: {
      id: group.id,
      name: group.name,
      createdBy: group.createdBy,
      members: normalizeMembers(group.members),
    },
  };
};

export const mergeGroupMembers = (
  ...sources: ReadonlyArray<ReadonlyArray<GroupMember>>
): GroupMember[] => {
  return normalizeMembers(sources.flat());
};

export const createGroupInvitePayload = (group: Group): string => {
  return JSON.stringify(toPayload(group));
};

export const createGroupInvitePassphrase = (group: Group): string => {
  const payload = toPayload(group);
  const memberSegment = payload.group.members
    .map((member) => {
      return [
        encodeURIComponent(member.id),
        encodeURIComponent(member.name),
        String(member.joinedAt),
      ].join('~');
    })
    .join(';');

  return [
    INVITE_PREFIX,
    encodeURIComponent(payload.group.id),
    encodeURIComponent(payload.group.name),
    encodeURIComponent(payload.group.createdBy),
    memberSegment,
  ].join('|');
};

const parsePassphrase = (raw: string): GroupInviteData => {
  const parts = raw.split('|');
  if (parts.length !== 5 || parts[0] !== INVITE_PREFIX) {
    throw new Error('Invalid invite passphrase format.');
  }

  const [, encodedGroupId, encodedName, encodedCreatedBy, encodedMembers] = parts;

  if (!encodedGroupId || !encodedName || !encodedCreatedBy) {
    throw new Error('Invite passphrase is missing required data.');
  }

  const members = encodedMembers
    ? encodedMembers
        .split(';')
        .filter((segment) => segment.trim().length > 0)
        .map((segment) => {
          const [encodedId, encodedMemberName, joinedAtRaw] = segment.split('~');
          if (!encodedId || !encodedMemberName) {
            throw new Error('Invite passphrase has an invalid member entry.');
          }

          const joinedAt = Number(joinedAtRaw);
          return {
            id: decodeURIComponent(encodedId),
            name: decodeURIComponent(encodedMemberName),
            joinedAt: Number.isFinite(joinedAt) ? joinedAt : Date.now(),
          };
        })
    : [];

  return {
    id: decodeURIComponent(encodedGroupId),
    name: decodeURIComponent(encodedName),
    createdBy: decodeURIComponent(encodedCreatedBy),
    members: normalizeMembers(members),
  };
};

const parsePayload = (raw: string): GroupInviteData => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invite payload is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Invite payload has an invalid format.');
  }

  if (parsed.type !== 'group-invite' || parsed.version !== 1) {
    throw new Error('Unsupported invite payload version.');
  }

  if (!isRecord(parsed.group)) {
    throw new Error('Invite payload is missing group data.');
  }

  if (
    typeof parsed.group.id !== 'string' ||
    typeof parsed.group.name !== 'string' ||
    typeof parsed.group.createdBy !== 'string'
  ) {
    throw new Error('Invite payload has invalid group fields.');
  }

  return {
    id: parsed.group.id,
    name: parsed.group.name,
    createdBy: parsed.group.createdBy,
    members: parseMembersFromUnknown(parsed.group.members),
  };
};

export const parseGroupInviteInput = (rawInput: string): GroupInviteData => {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Invite code is empty.');
  }

  if (trimmed.startsWith(`${INVITE_PREFIX}|`)) {
    return parsePassphrase(trimmed);
  }

  return parsePayload(trimmed);
};
