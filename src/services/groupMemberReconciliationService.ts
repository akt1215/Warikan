import type { Group, GroupMember, Transaction } from '../types';
import { mergeGroupMembers } from './groupInviteService';

export interface ReconcileGroupMembersInput {
  groups: ReadonlyArray<Group>;
  transactions: ReadonlyArray<Transaction>;
  profileNamesByUserId?: Readonly<Record<string, string>>;
}

export interface ReconcileGroupMembersResult {
  groups: Group[];
  groupsUpdated: number;
  membersAdded: number;
  updatedGroupIds: string[];
}

const normalizeId = (value: string): string => value.trim();

const normalizeProfileNames = (
  profileNamesByUserId: ReconcileGroupMembersInput['profileNamesByUserId'],
): Map<string, string> => {
  const normalized = new Map<string, string>();
  if (!profileNamesByUserId) {
    return normalized;
  }

  for (const [rawId, rawName] of Object.entries(profileNamesByUserId)) {
    const id = normalizeId(rawId);
    const name = rawName.trim();
    if (!id || !name) {
      continue;
    }

    normalized.set(id, name);
  }

  return normalized;
};

const collectParticipantsByGroup = (
  transactions: ReadonlyArray<Transaction>,
): Map<string, Map<string, number>> => {
  const participantsByGroup = new Map<string, Map<string, number>>();

  for (const transaction of transactions) {
    const groupId = transaction.groupId.trim();
    if (!groupId) {
      continue;
    }

    const participantIds = new Set<string>();
    participantIds.add(normalizeId(transaction.payerId));
    participantIds.add(normalizeId(transaction.createdBy));

    for (const split of transaction.splits) {
      participantIds.add(normalizeId(split.userId));
    }

    const existing = participantsByGroup.get(groupId) ?? new Map<string, number>();
    const timestamp = Number.isFinite(transaction.occurredAt)
      ? transaction.occurredAt
      : Number.isFinite(transaction.createdAt)
        ? transaction.createdAt
        : Date.now();

    for (const participantId of participantIds) {
      if (!participantId) {
        continue;
      }

      const existingTimestamp = existing.get(participantId);
      if (existingTimestamp === undefined || timestamp < existingTimestamp) {
        existing.set(participantId, timestamp);
      }
    }

    participantsByGroup.set(groupId, existing);
  }

  return participantsByGroup;
};

const areMembersEquivalent = (
  left: ReadonlyArray<GroupMember>,
  right: ReadonlyArray<GroupMember>,
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  const rightById = new Map(right.map((member) => [member.id, member]));
  for (const member of left) {
    const other = rightById.get(member.id);
    if (!other) {
      return false;
    }

    if (other.name !== member.name || other.joinedAt !== member.joinedAt) {
      return false;
    }
  }

  return true;
};

const getMemberCount = (members: ReadonlyArray<GroupMember>): number => {
  return new Set(members.map((member) => member.id)).size;
};

export const reconcileGroupMembersFromTransactions = ({
  groups,
  transactions,
  profileNamesByUserId,
}: ReconcileGroupMembersInput): ReconcileGroupMembersResult => {
  const profileNames = normalizeProfileNames(profileNamesByUserId);
  const participantsByGroup = collectParticipantsByGroup(transactions);
  let groupsUpdated = 0;
  let membersAdded = 0;
  const updatedGroupIds: string[] = [];
  const reconciliationTimestamp = Date.now();

  const reconciledGroups = groups.map((group) => {
    const participants = participantsByGroup.get(group.id) ?? new Map<string, number>();

    const existingMemberIds = new Set(group.members.map((member) => normalizeId(member.id)));

    const renamedMembers = group.members
      .map((member) => {
        const normalizedId = normalizeId(member.id);
        const profileName = profileNames.get(normalizedId);

        if (!profileName || profileName === member.name) {
          return null;
        }

        return {
          id: normalizedId,
          name: profileName,
          joinedAt: member.joinedAt,
        };
      })
      .filter((member): member is GroupMember => member !== null);

    const missingMembers: GroupMember[] = [];
    if (participants.size > 0) {
      for (const [participantId, joinedAt] of participants.entries()) {
        if (existingMemberIds.has(participantId)) {
          continue;
        }

        missingMembers.push({
          id: participantId,
          name: profileNames.get(participantId) ?? participantId,
          joinedAt,
        });
      }
    }

    if (renamedMembers.length === 0 && missingMembers.length === 0) {
      return group;
    }

    const mergedMembers = mergeGroupMembers(group.members, renamedMembers, missingMembers);
    if (areMembersEquivalent(group.members, mergedMembers)) {
      return group;
    }

    groupsUpdated += 1;
    membersAdded += Math.max(getMemberCount(mergedMembers) - getMemberCount(group.members), 0);
    updatedGroupIds.push(group.id);

    return {
      ...group,
      members: mergedMembers,
      updatedAt: Math.max(group.updatedAt, reconciliationTimestamp),
    };
  });

  return {
    groups: reconciledGroups,
    groupsUpdated,
    membersAdded,
    updatedGroupIds,
  };
};
