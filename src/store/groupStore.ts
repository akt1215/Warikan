import { create } from 'zustand';

import type { Group, GroupMember, Transaction } from '../types';
import {
  createGroupRecord,
  deleteGroupRecord,
  getGroupsByUser,
  upsertGroupRecord,
} from '../services/database';
import {
  createGroupInvitePassphrase,
  createGroupInvitePayload,
  firebaseService,
  mergeGroupMembers,
  parseGroupInviteInput,
  reconcileGroupMembersFromTransactions,
} from '../services';
import { generateId } from '../utils';

interface GroupInviteBundle {
  payload: string;
  passphrase: string;
}

interface GroupRefreshResult {
  group: Group | null;
  cloudSynced: boolean;
}

interface ReconcileMembersResult {
  groupsUpdated: number;
  membersAdded: number;
}

interface GroupStoreState {
  groups: Group[];
  isLoading: boolean;
  loadGroups: (userId: string) => Promise<void>;
  createGroup: (userId: string, userName: string, name: string) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;
  generateInviteForGroup: (groupId: string) => GroupInviteBundle;
  joinGroupFromInvite: (
    userId: string,
    userName: string,
    inviteInput: string,
  ) => Promise<Group>;
  reconcileMembersFromTransactions: (
    userId: string,
    transactions: ReadonlyArray<Transaction>,
    profileNamesByUserId?: Readonly<Record<string, string>>,
  ) => Promise<ReconcileMembersResult>;
  refreshGroupMembers: (userId: string, groupId: string) => Promise<GroupRefreshResult>;
  setGroups: (groups: Group[]) => void;
}

const createMembers = (
  userId: string,
  userName: string,
  joinedAt: number,
): GroupMember[] => {
  return [
    {
      id: userId,
      name: userName.trim() || 'You',
      joinedAt,
    },
  ];
};

export const useGroupStore = create<GroupStoreState>((set, get) => ({
  groups: [],
  isLoading: false,

  loadGroups: async (userId) => {
    set({ isLoading: true });

    try {
      const groups = await getGroupsByUser(userId);
      set({ groups });
    } finally {
      set({ isLoading: false });
    }
  },

  createGroup: async (userId, userName, name) => {
    const timestamp = Date.now();
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error('Group name is required.');
    }

    const group: Group = {
      id: generateId(),
      name: normalizedName,
      isDefault: false,
      createdBy: userId,
      members: createMembers(userId, userName, timestamp),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await createGroupRecord(group);

    set((state) => ({
      groups: [...state.groups, group].sort((left, right) => left.createdAt - right.createdAt),
    }));

    return group;
  },

  deleteGroup: async (groupId) => {
    const target = get().groups.find((group) => group.id === groupId);
    if (!target) {
      return;
    }

    if (target.isDefault) {
      throw new Error('Default groups cannot be deleted.');
    }

    await deleteGroupRecord(groupId);

    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
    }));
  },

  generateInviteForGroup: (groupId) => {
    const group = get().groups.find((entry) => entry.id === groupId);
    if (!group) {
      throw new Error('Group not found.');
    }

    return {
      payload: createGroupInvitePayload(group),
      passphrase: createGroupInvitePassphrase(group),
    };
  },

  joinGroupFromInvite: async (userId, userName, inviteInput) => {
    const parsedInvite = parseGroupInviteInput(inviteInput);
    const timestamp = Date.now();
    const normalizedUserName = userName.trim() || 'You';
    const currentUserMember: GroupMember = {
      id: userId,
      name: normalizedUserName,
      joinedAt: timestamp,
    };

    const existing = get().groups.find((group) => group.id === parsedInvite.id);

    const removeLegacyPlaceholder = (
      members: ReadonlyArray<GroupMember>,
      targetName: string,
    ): GroupMember[] => {
      const normalizedName = targetName.trim().toLowerCase();

      return members.filter((member) => {
        const memberName = member.name.trim().toLowerCase();
        const isLegacyPlaceholder = member.id.trim() === member.name.trim();
        return !(isLegacyPlaceholder && memberName === normalizedName);
      });
    };

    const mergedMembers = mergeGroupMembers(
      removeLegacyPlaceholder(parsedInvite.members, normalizedUserName),
      removeLegacyPlaceholder(existing ? existing.members : [], normalizedUserName),
      [currentUserMember],
    );

    const mergedGroup: Group = {
      id: parsedInvite.id,
      name: parsedInvite.name,
      isDefault: existing?.isDefault ?? false,
      createdBy: parsedInvite.createdBy,
      members: mergedMembers,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    await upsertGroupRecord(mergedGroup);

    set((state) => {
      const rest = state.groups.filter((group) => group.id !== mergedGroup.id);
      return {
        groups: [...rest, mergedGroup].sort((left, right) => left.createdAt - right.createdAt),
      };
    });

    return mergedGroup;
  },

  refreshGroupMembers: async (userId, groupId) => {
    const groups = await getGroupsByUser(userId);
    const localGroup = groups.find((group) => group.id === groupId);

    if (!localGroup) {
      set({ groups });
      return {
        group: null,
        cloudSynced: false,
      };
    }

    const syncResult = await firebaseService.syncGroup(localGroup);
    await upsertGroupRecord(syncResult.group);

    const refreshedGroups = await getGroupsByUser(userId);
    set({ groups: refreshedGroups });

    return {
      group: syncResult.group,
      cloudSynced: syncResult.success,
    };
  },

  reconcileMembersFromTransactions: async (
    userId,
    transactions,
    profileNamesByUserId = {},
  ) => {
    const groups = await getGroupsByUser(userId);
    const reconciled = reconcileGroupMembersFromTransactions({
      groups,
      transactions,
      profileNamesByUserId,
    });

    if (reconciled.groupsUpdated > 0) {
      for (const groupId of reconciled.updatedGroupIds) {
        const updatedGroup = reconciled.groups.find((group) => group.id === groupId);
        if (updatedGroup) {
          await upsertGroupRecord(updatedGroup);
        }
      }
    }

    set({ groups: reconciled.groups });

    return {
      groupsUpdated: reconciled.groupsUpdated,
      membersAdded: reconciled.membersAdded,
    };
  },

  setGroups: (groups) => {
    set({ groups });
  },
}));
