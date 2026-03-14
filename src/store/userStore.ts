import { create } from 'zustand';

import type { User } from '../types';
import { createDefaultGroups, createLocalUser, getLocalUser, updateLocalUser } from '../services/database';
import { generateId } from '../utils';

interface UserStoreState {
  user: User | null;
  isLoading: boolean;
  hasHydrated: boolean;
  initialize: () => Promise<void>;
  createUser: (name: string, baseCurrency: string) => Promise<User>;
  updateProfile: (updates: { name: string; baseCurrency: string }) => Promise<void>;
  setLastSyncedAt: (timestamp: number) => Promise<void>;
  clearState: () => void;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  isLoading: false,
  hasHydrated: false,

  initialize: async () => {
    set({ isLoading: true });

    try {
      const user = await getLocalUser();
      set({ user, hasHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  createUser: async (name, baseCurrency) => {
    const timestamp = Date.now();
    const user: User = {
      id: generateId(),
      name: name.trim(),
      baseCurrency,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastSyncedAt: 0,
    };

    await createLocalUser(user);
    await createDefaultGroups(user.id, user.name);

    set({ user, hasHydrated: true });
    return user;
  },

  updateProfile: async ({ name, baseCurrency }) => {
    const current = get().user;
    if (!current) {
      throw new Error('No user exists.');
    }

    const updated: User = {
      ...current,
      name: name.trim(),
      baseCurrency,
      updatedAt: Date.now(),
    };

    await updateLocalUser(updated);
    set({ user: updated });
  },

  setLastSyncedAt: async (timestamp) => {
    const current = get().user;
    if (!current) {
      return;
    }

    const updated: User = {
      ...current,
      lastSyncedAt: timestamp,
      updatedAt: Date.now(),
    };

    await updateLocalUser(updated);
    set({ user: updated });
  },

  clearState: () => {
    set({
      user: null,
      isLoading: false,
      hasHydrated: false,
    });
  },
}));
