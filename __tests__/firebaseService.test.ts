jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { firebaseService } from '../src/services/firebase';
import type { Group, Transaction } from '../src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FirebaseServicePrivateState = {
  runtimeConfig: unknown;
  hasLoadedRuntimeConfig: boolean;
  cloudSyncEnabled: boolean | null;
  app: unknown;
  auth: unknown;
  db: unknown;
  signInPromise: Promise<void> | null;
};

const getAsyncStorageMock = (): jest.Mocked<typeof AsyncStorage> => {
  return AsyncStorage as jest.Mocked<typeof AsyncStorage>;
};

const resetFirebaseServiceCache = (): void => {
  const service = firebaseService as unknown as FirebaseServicePrivateState;
  service.runtimeConfig = null;
  service.hasLoadedRuntimeConfig = false;
  service.cloudSyncEnabled = null;
  service.app = null;
  service.auth = null;
  service.db = null;
  service.signInPromise = null;
};

const baseGroup = (overrides: Partial<Group>): Group => ({
  id: 'group-local',
  name: 'Local Group',
  isDefault: false,
  createdBy: 'user-1',
  members: [{
    id: 'user-1',
    name: 'User One',
    joinedAt: 100,
  }],
  createdAt: 100,
  updatedAt: 100,
  ...overrides,
});

const baseTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  groupId: 'group-local',
  label: 'Trip',
  payerId: 'user-1',
  amount: 100,
  originalCurrency: 'USD',
  fee: 0,
  convertedAmount: 100,
  note: 'Lunch',
  splitType: 'equal',
  splits: [{ userId: 'user-2', amount: 50, isPaid: false }],
  createdBy: 'user-1',
  createdAt: 100,
  updatedAt: 100,
  syncId: 'sync-1',
  ...overrides,
});

describe('firebaseService.syncTransactions', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetFirebaseServiceCache();

    const storage = getAsyncStorageMock();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);
    storage.removeItem.mockResolvedValue(undefined);

    jest
      .spyOn(firebaseService as unknown as { isConfigured: () => Promise<boolean> }, 'isConfigured')
      .mockResolvedValue(true);
    jest.spyOn(firebaseService, 'pullTombstones').mockResolvedValue([]);
    jest.spyOn(firebaseService, 'pushTransactions').mockResolvedValue({
      success: true,
      message: 'ok',
      syncedCount: 0,
    });
    jest.spyOn(firebaseService, 'pushTombstones').mockResolvedValue(0);
    jest.spyOn(firebaseService, 'syncGroup').mockImplementation(async (group) => ({
      success: true,
      message: 'ok',
      group,
    }));
    jest.spyOn(firebaseService, 'pushUserAcquisitions').mockResolvedValue();
    jest.spyOn(firebaseService, 'pullUserAcquisitions').mockResolvedValue({});
  });

  test('expands sync scope with discovered cloud groups', async () => {
    const localGroup = baseGroup({ id: 'group-local' });
    const discoveredGroup = baseGroup({
      id: 'group-remote',
      name: 'Remote Group',
      members: [
        { id: 'user-1', name: 'User One', joinedAt: 100 },
        { id: 'user-2', name: 'User Two', joinedAt: 101 },
      ],
    });
    const discoveredTransaction = baseTransaction({
      id: 'tx-remote',
      syncId: 'sync-remote',
      groupId: discoveredGroup.id,
      createdBy: 'user-2',
      payerId: 'user-2',
    });

    const pullTransactionsSpy = jest.spyOn(firebaseService, 'pullTransactions')
      .mockResolvedValue([discoveredTransaction]);
    jest.spyOn(firebaseService, 'pullGroupsForMember').mockResolvedValue([discoveredGroup]);

    const result = await firebaseService.syncTransactions(
      [],
      [localGroup.id],
      [localGroup],
      [],
      'user-1',
      [],
    );

    expect(pullTransactionsSpy).toHaveBeenCalledWith(
      expect.arrayContaining([localGroup.id, discoveredGroup.id]),
    );
    expect(result.scopeGroupCount).toBe(2);
    expect(result.syncedGroups.map((group) => group.id)).toEqual(
      expect.arrayContaining([localGroup.id, discoveredGroup.id]),
    );
    expect(result.added).toBe(1);
  });

  test('returns explicit no-op reason when no shared group scope exists', async () => {
    const pullTransactionsSpy = jest.spyOn(firebaseService, 'pullTransactions').mockResolvedValue([]);
    const syncGroupSpy = jest.spyOn(firebaseService, 'syncGroup');
    jest.spyOn(firebaseService, 'pullGroupsForMember').mockResolvedValue([]);

    const result = await firebaseService.syncTransactions(
      [],
      [],
      [],
      [],
      'user-1',
      [],
    );

    expect(pullTransactionsSpy).toHaveBeenCalledWith([]);
    expect(syncGroupSpy).not.toHaveBeenCalled();
    expect(result.scopeGroupCount).toBe(0);
    expect(result.noOpReason).toBe('No shared cloud groups were found for this user.');
    expect(result.message).toContain('Scoped 0 group(s).');
  });

  test('uses newest group metadata for default and name during merge', async () => {
    const localGroup = baseGroup({
      id: 'group-shared',
      name: 'Renamed Group',
      isDefault: false,
      updatedAt: 300,
    });
    const discoveredGroup = baseGroup({
      id: 'group-shared',
      name: 'Older Name',
      isDefault: true,
      updatedAt: 100,
    });

    jest.spyOn(firebaseService, 'pullTransactions').mockResolvedValue([]);
    jest.spyOn(firebaseService, 'pullGroupsForMember').mockResolvedValue([discoveredGroup]);

    const result = await firebaseService.syncTransactions(
      [],
      [localGroup.id],
      [localGroup],
      [],
      'user-1',
      [],
    );

    const mergedGroup = result.syncedGroups.find((group) => group.id === localGroup.id);
    expect(mergedGroup?.name).toBe('Renamed Group');
    expect(mergedGroup?.isDefault).toBe(false);
  });
});

describe('firebaseService cloud toggle', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetFirebaseServiceCache();

    const storage = getAsyncStorageMock();
    storage.getItem.mockReset();
    storage.setItem.mockReset();
    storage.removeItem.mockReset();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);
    storage.removeItem.mockResolvedValue(undefined);
  });

  test('defaults to disabled cloud sync when no toggle flag is stored', async () => {
    const enabled = await firebaseService.isCloudSyncEnabled();
    expect(enabled).toBe(false);
  });

  test('short-circuits cloud sync when toggle is disabled', async () => {
    await firebaseService.setCloudSyncEnabled(false);
    const pullTransactionsSpy = jest.spyOn(firebaseService, 'pullTransactions');

    const result = await firebaseService.syncTransactions(
      [],
      [],
      [],
      [],
      'user-1',
      [],
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('Cloud sync is disabled in settings.');
    expect(result.noOpReason).toBe('Cloud sync is disabled in settings.');
    expect(pullTransactionsSpy).not.toHaveBeenCalled();
  });
});
