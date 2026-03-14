import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  type Auth,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore/lite';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TRANSACTION_LABEL } from '../constants';
import type {
  CurrencyAcquisition,
  Group,
  SyncMergeResult,
  Transaction,
  TransactionTombstone,
} from '../types';
import { mergeGroupMembers } from './groupInviteService';
import {
  applyTransactionTombstones,
  mergeTransactionTombstones,
  mergeTransactions,
} from './syncService';

export interface FirebaseSyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
}

export interface FirebaseSyncMergeResult extends SyncMergeResult, FirebaseSyncResult {
  pulledCount: number;
  pushedCount: number;
  participantProfiles: Record<string, string>;
  tombstones: TransactionTombstone[];
  acquisitionsByUser: Record<string, CurrencyAcquisition[]>;
}

export interface FirebaseGroupSyncResult {
  success: boolean;
  message: string;
  group: Group;
}

export interface FirebaseRuntimeConfigInput {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FIREBASE_COLLECTION = 'transactions';
const FIREBASE_GROUP_COLLECTION = 'groups';
const FIREBASE_TOMBSTONE_COLLECTION = 'transaction_tombstones';
const FIREBASE_ACQUISITION_COLLECTION = 'user_acquisitions';
const FIREBASE_CONFIG_STORAGE_KEY = '@warikan/firebase-config';

// One-time script-level Firebase config shared by all users of this app build.
// SECURITY: keep real values out of git. Prefer EXPO_PUBLIC_FIREBASE_* env vars
// (e.g. .env.local ignored by git) or runtime setup from Settings.
const SCRIPT_FIREBASE_CONFIG: FirebaseRuntimeConfigInput = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

const chunkArray = <T>(entries: ReadonlyArray<T>, size: number): T[][] => {
  if (size <= 0) {
    return [Array.from(entries)];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < entries.length; index += size) {
    chunks.push(entries.slice(index, index + size));
  }
  return chunks;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getFirebaseErrorCode = (error: unknown): string | null => {
  if (isRecord(error) && typeof error.code === 'string') {
    return error.code;
  }

  return null;
};

const toFriendlyFirebaseAuthError = (error: unknown): Error => {
  const code = getFirebaseErrorCode(error);

  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    return new Error(
      'Firebase Authentication is not configured for Anonymous sign-in. ' +
      'In Firebase Console, open Authentication -> Sign-in method and enable Anonymous.',
    );
  }

  if (code === 'auth/invalid-api-key') {
    return new Error(
      'Firebase API key is invalid for this project. Check SCRIPT_FIREBASE_CONFIG values.',
    );
  }

  return error instanceof Error ? error : new Error('Firebase authentication failed.');
};

const parseSplitArray = (value: unknown): Transaction['splits'] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const splits: Transaction['splits'] = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.userId !== 'string' ||
      typeof entry.amount !== 'number' ||
      typeof entry.isPaid !== 'boolean'
    ) {
      return null;
    }

    splits.push({
      userId: entry.userId,
      amount: entry.amount,
      isPaid: entry.isPaid,
    });
  }

  return splits;
};

const parseTransaction = (value: unknown): Transaction | null => {
  if (!isRecord(value)) {
    return null;
  }

  const splitType = value.splitType === 'equal' || value.splitType === 'custom'
    ? value.splitType
    : null;
  if (!splitType) {
    return null;
  }

  const splits = parseSplitArray(value.splits);
  if (!splits) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.groupId !== 'string' ||
    typeof value.payerId !== 'string' ||
    typeof value.amount !== 'number' ||
    typeof value.originalCurrency !== 'string' ||
    typeof value.fee !== 'number' ||
    typeof value.convertedAmount !== 'number' ||
    typeof value.note !== 'string' ||
    typeof value.createdBy !== 'string' ||
    typeof value.createdAt !== 'number' ||
    typeof value.updatedAt !== 'number' ||
    typeof value.syncId !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    groupId: value.groupId,
    label: typeof value.label === 'string' && value.label.trim()
      ? value.label
      : DEFAULT_TRANSACTION_LABEL,
    payerId: value.payerId,
    amount: value.amount,
    originalCurrency: value.originalCurrency,
    fee: value.fee,
    convertedAmount: value.convertedAmount,
    note: value.note,
    splitType,
    splits,
    createdBy: value.createdBy,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    syncId: value.syncId,
  };
};

const parseTransactionTombstone = (value: unknown): TransactionTombstone | null => {
  if (
    !isRecord(value) ||
    typeof value.syncId !== 'string' ||
    typeof value.groupId !== 'string' ||
    typeof value.deletedAt !== 'number' ||
    typeof value.deletedBy !== 'string'
  ) {
    return null;
  }

  const syncId = value.syncId.trim();
  const groupId = value.groupId.trim();
  const deletedBy = value.deletedBy.trim();
  if (!syncId || !groupId || !deletedBy) {
    return null;
  }

  return {
    syncId,
    groupId,
    deletedAt: value.deletedAt,
    deletedBy,
  };
};

const parseCurrencyAcquisition = (value: unknown): CurrencyAcquisition | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.userId !== 'string' ||
    typeof value.currency !== 'string' ||
    typeof value.amount !== 'number' ||
    typeof value.paidAmount !== 'number' ||
    typeof value.rate !== 'number' ||
    typeof value.acquiredAt !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    userId: value.userId,
    currency: value.currency,
    amount: value.amount,
    paidAmount: value.paidAmount,
    rate: value.rate,
    acquiredAt: value.acquiredAt,
    note: typeof value.note === 'string' ? value.note : undefined,
  };
};

const parseGroupMembers = (
  value: unknown,
  fallbackJoinedAt: number,
): Group['members'] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const members: Group['members'] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      members.push({
        id: entry,
        name: entry,
        joinedAt: fallbackJoinedAt,
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
        joinedAt:
          typeof entry.joinedAt === 'number' ? entry.joinedAt : fallbackJoinedAt,
      });
      continue;
    }

    return null;
  }

  return mergeGroupMembers(members);
};

const parseGroup = (value: unknown): Group | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.isDefault !== 'boolean' ||
    typeof value.createdBy !== 'string' ||
    typeof value.createdAt !== 'number' ||
    typeof value.updatedAt !== 'number'
  ) {
    return null;
  }

  const members = parseGroupMembers(value.members, value.createdAt);
  if (!members) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    isDefault: value.isDefault,
    createdBy: value.createdBy,
    members,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const buildProfileNamesFromGroups = (
  groups: ReadonlyArray<Group>,
): Record<string, string> => {
  const profileNames: Record<string, string> = {};

  for (const group of groups) {
    for (const member of group.members) {
      const memberId = member.id.trim();
      const memberName = member.name.trim();
      if (!memberId || !memberName) {
        continue;
      }

      profileNames[memberId] = memberName;
    }
  }

  return profileNames;
};

const mergeSyncedGroup = (localGroup: Group, remoteGroup: Group | null): Group => {
  if (!remoteGroup) {
    return {
      ...localGroup,
      members: mergeGroupMembers(localGroup.members),
    };
  }

  return {
    id: localGroup.id,
    name: localGroup.updatedAt >= remoteGroup.updatedAt ? localGroup.name : remoteGroup.name,
    isDefault: localGroup.isDefault || remoteGroup.isDefault,
    createdBy: remoteGroup.createdBy || localGroup.createdBy,
    members: mergeGroupMembers(remoteGroup.members, localGroup.members),
    createdAt: Math.min(localGroup.createdAt, remoteGroup.createdAt),
    updatedAt: Math.max(localGroup.updatedAt, remoteGroup.updatedAt),
  };
};

const normalizeFirebaseConfig = (config: FirebaseRuntimeConfigInput): FirebaseOptions | null => {
  const normalized: FirebaseOptions = {
    apiKey: config.apiKey.trim(),
    authDomain: config.authDomain.trim(),
    projectId: config.projectId.trim(),
    storageBucket: config.storageBucket.trim(),
    messagingSenderId: config.messagingSenderId.trim(),
    appId: config.appId.trim(),
  };

  const requiredValues = [
    normalized.apiKey,
    normalized.projectId,
    normalized.messagingSenderId,
    normalized.appId,
  ];

  if (requiredValues.some((value) => !value || !value.trim())) {
    return null;
  }

  return normalized;
};

const getFirebaseScriptConfig = (): FirebaseOptions | null => {
  return normalizeFirebaseConfig(SCRIPT_FIREBASE_CONFIG);
};

const getFirebaseEnvConfig = (): FirebaseOptions | null => {
  const config: FirebaseOptions = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const requiredValues = [
    config.apiKey,
    config.projectId,
    config.messagingSenderId,
    config.appId,
  ];

  if (requiredValues.some((value) => !value || !value.trim())) {
    return null;
  }

  return config;
};

const toRuntimeConfigInput = (config: FirebaseOptions): FirebaseRuntimeConfigInput => ({
  apiKey: config.apiKey?.trim() ?? '',
  authDomain: config.authDomain?.trim() ?? '',
  projectId: config.projectId?.trim() ?? '',
  storageBucket: config.storageBucket?.trim() ?? '',
  messagingSenderId: config.messagingSenderId?.trim() ?? '',
  appId: config.appId?.trim() ?? '',
});

const parseStoredFirebaseConfig = (raw: string): FirebaseOptions | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      typeof parsed.apiKey !== 'string' ||
      typeof parsed.authDomain !== 'string' ||
      typeof parsed.projectId !== 'string' ||
      typeof parsed.storageBucket !== 'string' ||
      typeof parsed.messagingSenderId !== 'string' ||
      typeof parsed.appId !== 'string'
    ) {
      return null;
    }

    return normalizeFirebaseConfig({
      apiKey: parsed.apiKey,
      authDomain: parsed.authDomain,
      projectId: parsed.projectId,
      storageBucket: parsed.storageBucket,
      messagingSenderId: parsed.messagingSenderId,
      appId: parsed.appId,
    });
  } catch {
    return null;
  }
};

class FirebaseService {
  private readonly scriptConfig: FirebaseOptions | null;
  private readonly envConfig: FirebaseOptions | null;
  private runtimeConfig: FirebaseOptions | null = null;
  private hasLoadedRuntimeConfig = false;
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private signInPromise: Promise<void> | null = null;

  constructor() {
    this.scriptConfig = getFirebaseScriptConfig();
    this.envConfig = getFirebaseEnvConfig();
  }

  get enabled(): boolean {
    return this.scriptConfig !== null || this.envConfig !== null || this.runtimeConfig !== null;
  }

  private getResolvedConfig(): FirebaseOptions | null {
    return this.scriptConfig ?? this.envConfig ?? this.runtimeConfig;
  }

  private async isConfigured(): Promise<boolean> {
    await this.loadRuntimeConfig();
    return this.getResolvedConfig() !== null;
  }

  private async loadRuntimeConfig(): Promise<void> {
    if (this.hasLoadedRuntimeConfig) {
      return;
    }

    const raw = await AsyncStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    this.runtimeConfig = raw ? parseStoredFirebaseConfig(raw) : null;
    this.hasLoadedRuntimeConfig = true;
  }

  async getRuntimeConfigInput(): Promise<FirebaseRuntimeConfigInput | null> {
    await this.loadRuntimeConfig();
    const resolved = this.getResolvedConfig();
    if (!resolved) {
      return null;
    }

    return toRuntimeConfigInput(resolved);
  }

  async setRuntimeConfig(input: FirebaseRuntimeConfigInput): Promise<void> {
    const normalized = normalizeFirebaseConfig(input);
    if (!normalized) {
      throw new Error('Invalid Firebase config. Missing required fields.');
    }

    await AsyncStorage.setItem(
      FIREBASE_CONFIG_STORAGE_KEY,
      JSON.stringify(toRuntimeConfigInput(normalized)),
    );
    this.runtimeConfig = normalized;
    this.hasLoadedRuntimeConfig = true;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.signInPromise = null;
  }

  async clearRuntimeConfig(): Promise<void> {
    await AsyncStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    this.runtimeConfig = null;
    this.hasLoadedRuntimeConfig = true;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.signInPromise = null;
  }

  private async ensureClient(): Promise<void> {
    await this.loadRuntimeConfig();
    const resolvedConfig = this.getResolvedConfig();
    if (!resolvedConfig) {
      throw new Error('Firebase sync is not configured.');
    }

    if (!this.app) {
      this.app = getApps().length > 0 ? getApp() : initializeApp(resolvedConfig);
    }

    if (!this.auth) {
      this.auth = getAuth(this.app);
    }

    if (!this.db) {
      this.db = getFirestore(this.app);
    }
  }

  private async ensureSignedIn(): Promise<void> {
    await this.ensureClient();
    if (!this.auth || !this.db) {
      throw new Error('Firebase service not initialized.');
    }

    if (this.auth.currentUser) {
      return;
    }

    if (this.signInPromise) {
      await this.signInPromise;
      return;
    }

    this.signInPromise = signInAnonymously(this.auth)
      .then(() => undefined)
      .catch((error: unknown) => {
        throw toFriendlyFirebaseAuthError(error);
      })
      .finally(() => {
        this.signInPromise = null;
      });

    await this.signInPromise;
  }

  async pushTransactions(
    transactions: ReadonlyArray<Transaction>,
  ): Promise<FirebaseSyncResult> {
    if (!(await this.isConfigured())) {
      return {
        success: false,
        message: 'Firebase sync is not configured.',
        syncedCount: 0,
      };
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const deduped = mergeTransactions([], transactions).merged;
    await Promise.all(
      deduped.map(async (transaction) => {
        await setDoc(
          doc(this.db as Firestore, FIREBASE_COLLECTION, transaction.syncId),
          transaction,
        );
      }),
    );

    return {
      success: true,
      message: `Pushed ${deduped.length} transaction(s).`,
      syncedCount: deduped.length,
    };
  }

  async pullTransactions(groupIds: ReadonlyArray<string> = []): Promise<ReadonlyArray<Transaction>> {
    if (!(await this.isConfigured()) || groupIds.length === 0) {
      return [];
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const uniqueGroupIds = Array.from(
      new Set(groupIds.map((entry) => entry.trim()).filter((entry) => entry.length > 0)),
    );

    const pulled: Transaction[] = [];
    const chunks = chunkArray(uniqueGroupIds, 10);

    for (const groupChunk of chunks) {
      if (groupChunk.length === 0) {
        continue;
      }

      const snapshot = await getDocs(
        query(
          collection(this.db, FIREBASE_COLLECTION),
          where('groupId', 'in', groupChunk),
        ),
      );

      for (const documentSnapshot of snapshot.docs) {
        const parsed = parseTransaction(documentSnapshot.data());
        if (parsed) {
          pulled.push(parsed);
        }
      }
    }

    return mergeTransactions([], pulled).merged;
  }

  async pullGroup(groupId: string): Promise<Group | null> {
    if (!(await this.isConfigured()) || !groupId.trim()) {
      return null;
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const snapshot = await getDoc(doc(this.db, FIREBASE_GROUP_COLLECTION, groupId));
    if (!snapshot.exists()) {
      return null;
    }

    return parseGroup(snapshot.data());
  }

  async pullTombstones(groupIds: ReadonlyArray<string>): Promise<ReadonlyArray<TransactionTombstone>> {
    if (!(await this.isConfigured()) || groupIds.length === 0) {
      return [];
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const uniqueGroupIds = Array.from(
      new Set(groupIds.map((entry) => entry.trim()).filter((entry) => entry.length > 0)),
    );

    const pulled: TransactionTombstone[] = [];
    const chunks = chunkArray(uniqueGroupIds, 10);

    for (const groupChunk of chunks) {
      if (groupChunk.length === 0) {
        continue;
      }

      const snapshot = await getDocs(
        query(
          collection(this.db, FIREBASE_TOMBSTONE_COLLECTION),
          where('groupId', 'in', groupChunk),
        ),
      );

      for (const documentSnapshot of snapshot.docs) {
        const parsed = parseTransactionTombstone(documentSnapshot.data());
        if (parsed) {
          pulled.push(parsed);
        }
      }
    }

    return mergeTransactionTombstones([], pulled);
  }

  async pushTombstones(
    tombstones: ReadonlyArray<TransactionTombstone>,
  ): Promise<number> {
    if (!(await this.isConfigured()) || tombstones.length === 0) {
      return 0;
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const deduped = mergeTransactionTombstones([], tombstones);
    await Promise.all(
      deduped.map(async (tombstone) => {
        await setDoc(
          doc(this.db as Firestore, FIREBASE_TOMBSTONE_COLLECTION, tombstone.syncId),
          tombstone,
        );
      }),
    );

    return deduped.length;
  }

  async pushUserAcquisitions(
    userId: string,
    acquisitions: ReadonlyArray<CurrencyAcquisition>,
  ): Promise<void> {
    if (!(await this.isConfigured()) || !userId.trim()) {
      return;
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    await setDoc(
      doc(this.db as Firestore, FIREBASE_ACQUISITION_COLLECTION, userId),
      {
        userId,
        updatedAt: Date.now(),
        acquisitions: acquisitions
          .filter((acquisition) => acquisition.userId === userId)
          .sort((left, right) => right.acquiredAt - left.acquiredAt),
      },
    );
  }

  async pullUserAcquisitions(
    userIds: ReadonlyArray<string>,
  ): Promise<Record<string, CurrencyAcquisition[]>> {
    if (!(await this.isConfigured()) || userIds.length === 0) {
      return {};
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const uniqueUserIds = Array.from(new Set(userIds.map((id) => id.trim()).filter(Boolean)));
    const snapshots = await Promise.all(
      uniqueUserIds.map((userId) =>
        getDoc(doc(this.db as Firestore, FIREBASE_ACQUISITION_COLLECTION, userId))),
    );

    const acquisitionsByUser: Record<string, CurrencyAcquisition[]> = {};
    for (const snapshot of snapshots) {
      if (!snapshot.exists()) {
        continue;
      }

      const data = snapshot.data();
      if (
        !isRecord(data) ||
        typeof data.userId !== 'string' ||
        !Array.isArray(data.acquisitions)
      ) {
        continue;
      }

      const userId = data.userId.trim();
      if (!userId) {
        continue;
      }

      const parsed = data.acquisitions
        .map(parseCurrencyAcquisition)
        .filter((entry): entry is CurrencyAcquisition => entry !== null)
        .filter((entry) => entry.userId === userId)
        .sort((left, right) => right.acquiredAt - left.acquiredAt);

      acquisitionsByUser[userId] = parsed;
    }

    return acquisitionsByUser;
  }

  async syncTransactions(
    localTransactions: ReadonlyArray<Transaction>,
    groupIds: ReadonlyArray<string>,
    localGroups: ReadonlyArray<Group> = [],
    localTombstones: ReadonlyArray<TransactionTombstone> = [],
    currentUserId = '',
    currentUserAcquisitions: ReadonlyArray<CurrencyAcquisition> = [],
  ): Promise<FirebaseSyncMergeResult> {
    if (!(await this.isConfigured())) {
      const deduped = mergeTransactions([], localTransactions).merged;
      return {
        success: false,
        message: 'Firebase sync is not configured.',
        syncedCount: 0,
        merged: deduped,
        added: 0,
        updated: 0,
        skipped: 0,
        pulledCount: 0,
        pushedCount: 0,
        participantProfiles: buildProfileNamesFromGroups(localGroups),
        tombstones: mergeTransactionTombstones([], localTombstones),
        acquisitionsByUser: currentUserId
          ? { [currentUserId]: [...currentUserAcquisitions] }
          : {},
      };
    }

    const remoteTransactions = await this.pullTransactions(groupIds);
    const remoteTombstones = await this.pullTombstones(groupIds);
    const mergedResult = mergeTransactions(localTransactions, remoteTransactions);
    const mergedTombstones = mergeTransactionTombstones(
      localTombstones,
      remoteTombstones,
    );
    const mergedTransactions = applyTransactionTombstones(
      mergedResult.merged,
      mergedTombstones,
    );
    const mergedBySyncId = new Map(
      mergedResult.merged.map((transaction) => [transaction.syncId, transaction]),
    );

    const groupFilter = new Set(groupIds);
    const pushCandidates = mergedTransactions.filter((transaction) =>
      groupFilter.has(transaction.groupId),
    );
    const pushResult = await this.pushTransactions(pushCandidates);
    const effectiveTombstones = mergedTombstones.filter((tombstone) => {
      if (!groupFilter.has(tombstone.groupId)) {
        return false;
      }

      const transaction = mergedBySyncId.get(tombstone.syncId);
      return !transaction || tombstone.deletedAt >= transaction.updatedAt;
    });
    const pushedTombstonesCount = await this.pushTombstones(effectiveTombstones);
    if (this.db && effectiveTombstones.length > 0) {
      await Promise.all(
        effectiveTombstones.map((tombstone) =>
          deleteDoc(doc(this.db as Firestore, FIREBASE_COLLECTION, tombstone.syncId))),
      );
    }

    const groupsToSync = localGroups.filter((group) => groupFilter.has(group.id));
    const syncedGroupResults = await Promise.all(
      groupsToSync.map((group) => this.syncGroup(group)),
    );
    const participantProfiles = buildProfileNamesFromGroups(
      syncedGroupResults.map((entry) => entry.group),
    );
    const acquisitionUserIds = Array.from(new Set(
      groupsToSync.flatMap((group) => group.members.map((member) => member.id)),
    ));
    if (currentUserId.trim()) {
      acquisitionUserIds.push(currentUserId.trim());
      await this.pushUserAcquisitions(currentUserId, currentUserAcquisitions);
    }
    const acquisitionsByUser = await this.pullUserAcquisitions(acquisitionUserIds);
    if (currentUserId.trim() && !acquisitionsByUser[currentUserId.trim()]) {
      acquisitionsByUser[currentUserId.trim()] = currentUserAcquisitions
        .filter((acquisition) => acquisition.userId === currentUserId.trim())
        .sort((left, right) => right.acquiredAt - left.acquiredAt);
    }

    return {
      ...mergedResult,
      merged: mergedTransactions,
      success: true,
      message: `Synced ${pushResult.syncedCount} transaction(s) and ${pushedTombstonesCount} deletion(s) with cloud.`,
      syncedCount: pushResult.syncedCount + pushedTombstonesCount,
      pulledCount: remoteTransactions.length,
      pushedCount: pushResult.syncedCount + pushedTombstonesCount,
      participantProfiles,
      tombstones: mergedTombstones,
      acquisitionsByUser,
    };
  }

  async syncGroup(localGroup: Group): Promise<FirebaseGroupSyncResult> {
    if (!(await this.isConfigured())) {
      return {
        success: false,
        message: 'Firebase sync is not configured.',
        group: localGroup,
      };
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    const remoteGroup = await this.pullGroup(localGroup.id);
    const mergedGroup = mergeSyncedGroup(localGroup, remoteGroup);

    await setDoc(doc(this.db, FIREBASE_GROUP_COLLECTION, mergedGroup.id), {
      ...mergedGroup,
      memberIds: mergedGroup.members.map((member) => member.id),
    });

    return {
      success: true,
      message: remoteGroup
        ? 'Merged local and cloud group members.'
        : 'Uploaded group members to cloud.',
      group: mergedGroup,
    };
  }

  async deleteTransaction(syncId: string): Promise<void> {
    if (!(await this.isConfigured())) {
      return;
    }

    await this.ensureSignedIn();
    if (!this.db) {
      throw new Error('Firebase database not initialized.');
    }

    await deleteDoc(doc(this.db, FIREBASE_COLLECTION, syncId));
  }
}

export const firebaseService = new FirebaseService();
