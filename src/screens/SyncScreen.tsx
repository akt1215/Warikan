import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Button, Card, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { firebaseService } from '../services';
import { useCurrencyStore, useGroupStore, useTransactionStore, useUserStore } from '../store';
import { isTravelGroup } from '../utils';

export const SyncScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const upsertSyncedGroups = useGroupStore((state) => state.upsertSyncedGroups);
  const reconcileMembersFromTransactions = useGroupStore(
    (state) => state.reconcileMembersFromTransactions,
  );
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const replaceSyncedUserAcquisitions = useCurrencyStore(
    (state) => state.replaceSyncedUserAcquisitions,
  );
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const replaceTransactions = useTransactionStore((state) => state.replaceTransactions);
  const upsertTombstones = useTransactionStore((state) => state.upsertTombstones);

  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);
  const [isCloudStatusLoading, setIsCloudStatusLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsCloudStatusLoading(true);

      void firebaseService
        .isCloudSyncEnabled()
        .then((enabled) => {
          if (isActive) {
            setIsCloudSyncEnabled(enabled);
          }
        })
        .catch(() => {
          if (isActive) {
            setIsCloudSyncEnabled(false);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsCloudStatusLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleCloudSync = async (): Promise<void> => {
    if (!user || isCloudSyncing) {
      return;
    }

    setIsCloudSyncing(true);
    try {
      const cloudEnabled = await firebaseService.isCloudSyncEnabled();
      setIsCloudSyncEnabled(cloudEnabled);
      if (!cloudEnabled) {
        Alert.alert(
          'Cloud sync disabled',
          'Enable Firebase Cloud Sync in Settings before running cloud sync.',
        );
        return;
      }

      await loadGroups(user.id);
      await loadAcquisitions(user.id);
      await loadTransactions();

      const groups = useGroupStore.getState().groups;
      const transactions = useTransactionStore.getState().transactions;
      const tombstones = useTransactionStore.getState().tombstones;
      const currentUserAcquisitions = useCurrencyStore.getState().acquisitions;
      const travelGroupIds = groups
        .filter(isTravelGroup)
        .map((group) => group.id);

      const result = await firebaseService.syncTransactions(
        transactions,
        travelGroupIds,
        groups,
        tombstones,
        user.id,
        currentUserAcquisitions,
      );

      const syncedGroupsCount = await upsertSyncedGroups(user.id, result.syncedGroups);
      await replaceTransactions(result.merged);
      await upsertTombstones(result.tombstones);

      for (const [syncedUserId, syncedAcquisitions] of Object.entries(result.acquisitionsByUser)) {
        await replaceSyncedUserAcquisitions(
          user.id,
          syncedUserId,
          syncedAcquisitions,
        );
      }

      const reconciliation = await reconcileMembersFromTransactions(
        user.id,
        result.merged,
        result.participantProfiles,
      );

      Alert.alert(
        result.success ? 'Cloud sync complete' : 'Cloud sync skipped',
        `${result.message} Added ${result.added}, updated ${result.updated}, skipped ${result.skipped}. Pulled ${result.pulledCount} transaction(s) and ${result.pulledTombstoneCount} deletion(s). Imported ${syncedGroupsCount} group(s). Members added ${reconciliation.membersAdded} across ${reconciliation.groupsUpdated} group(s).`,
      );
    } catch (error) {
      Alert.alert(
        'Cloud sync failed',
        error instanceof Error ? error.message : 'Unknown error.',
      );
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">Sync</Typography>

      <Card>
        <Typography variant="h4">QR Sync</Typography>
        <View style={styles.cardBody}>
          <Typography variant="caption">
            Scan or generate payloads to sync directly between devices.
          </Typography>
          <Button
            onPress={() => {
              navigation.navigate('QRSync');
            }}
            title="Open QR Sync"
          />
        </View>
      </Card>

      <Card>
        <Typography variant="h4">Cloud Sync</Typography>
        <View style={styles.cardBody}>
          <Typography variant="caption">
            Firebase cloud sync is currently {isCloudSyncEnabled ? 'ON' : 'OFF'} on this device.
          </Typography>
          {!isCloudSyncEnabled ? (
            <Typography variant="caption">
              Enable Firebase Cloud Sync in Settings to use cloud sync.
            </Typography>
          ) : null}
          <Button
            disabled={isCloudStatusLoading || !isCloudSyncEnabled || isCloudSyncing}
            onPress={() => {
              void handleCloudSync();
            }}
            title={
              isCloudStatusLoading
                ? 'Checking Cloud Sync...'
                : isCloudSyncing
                  ? 'Syncing...'
                  : 'Run Cloud Sync'
            }
            variant="secondary"
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  cardBody: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
