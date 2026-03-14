import { create } from 'zustand';

import type { Group } from '../types';
import {
  createGroupRecord,
  deleteGroupRecord,
  getGroupsByUser,
} from '../services/database';
import { generateId } from '../utils';

interface GroupStoreState {
  groups: Group[];
  isLoading: boolean;
  loadGroups: (userId: string) => Promise<void>;
  createGroup: (userId: string, name: string, memberIds?: string[]) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;
  setGroups: (groups: Group[]) => void;
}

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

  createGroup: async (userId, name, memberIds) => {
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
      memberIds: memberIds && memberIds.length > 0 ? memberIds : [userId],
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

  setGroups: (groups) => {
    set({ groups });
  },
}));
