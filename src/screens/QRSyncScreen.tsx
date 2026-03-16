import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { QRGenerator, QRScanner } from '../components/sync';
import { Button, Card, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import {
  applyTransactionTombstones,
  mergeTransactionTombstones,
  parseSyncPayload,
  refreshTransactionsForBalance,
} from '../services';
import { useCurrencyStore, useGroupStore, useSyncStore, useTransactionStore, useUserStore } from '../store';
import { isTravelGroup } from '../utils';

export const QRSyncScreen = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const setLastSyncedAt = useUserStore((state) => state.setLastSyncedAt);
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const upsertSyncedGroups = useGroupStore((state) => state.upsertSyncedGroups);
  const reconcileMembersFromTransactions = useGroupStore(
    (state) => state.reconcileMembersFromTransactions,
  );
  const acquisitions = useCurrencyStore((state) => state.acquisitions);
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const replaceSyncedUserAcquisitions = useCurrencyStore(
    (state) => state.replaceSyncedUserAcquisitions,
  );
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);

  const transactions = useTransactionStore((state) => state.transactions);
  const tombstones = useTransactionStore((state) => state.tombstones);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const replaceTransactions = useTransactionStore((state) => state.replaceTransactions);
  const upsertTombstones = useTransactionStore((state) => state.upsertTombstones);

  const generatePayload = useSyncStore((state) => state.generatePayload);
  const mergePayload = useSyncStore((state) => state.mergePayload);
  const lastMergeResult = useSyncStore((state) => state.lastMergeResult);

  const [generatedPayload, setGeneratedPayload] = useState('');
  const [incomingPayload, setIncomingPayload] = useState('');

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadGroups(user.id);
    void loadAcquisitions(user.id);
  }, [loadAcquisitions, loadGroups, user]);

  const participantProfiles = useMemo(() => {
    const profiles: Record<string, string> = {};

    if (user) {
      profiles[user.id] = user.name;
    }

    for (const group of groups) {
      for (const member of group.members) {
        const memberId = member.id.trim();
        const memberName = member.name.trim();
        if (!memberId || !memberName) {
          continue;
        }

        profiles[memberId] = memberName;
      }
    }

    return profiles;
  }, [groups, user]);

  const handleGenerate = (): void => {
    if (!user) {
      return;
    }

    const payload = generatePayload(
      user.id,
      transactions,
      user.lastSyncedAt,
      participantProfiles,
      tombstones,
      acquisitions,
      groups.filter(isTravelGroup),
    );
    setGeneratedPayload(payload);
  };

  const handleMerge = async (): Promise<void> => {
    if (!incomingPayload.trim()) {
      Alert.alert('Payload required', 'Paste a payload first.');
      return;
    }

    try {
      const parsedPayload = parseSyncPayload(incomingPayload);
      const result = mergePayload(transactions, incomingPayload);
      const mergedTombstones = mergeTransactionTombstones(
        tombstones,
        parsedPayload.transactionTombstones ?? [],
      );
      const mergedTransactions = applyTransactionTombstones(
        result.merged,
        mergedTombstones,
      );

      if (user && parsedPayload.currencyAcquisitions) {
        await replaceSyncedUserAcquisitions(
          user.id,
          parsedPayload.generatedBy,
          parsedPayload.currencyAcquisitions,
        );
      }

      const syncedGroupsCount = user
        ? await upsertSyncedGroups(user.id, parsedPayload.groups ?? [])
        : 0;

      const refreshed = user
        ? refreshTransactionsForBalance({
          transactions: mergedTransactions,
          baseCurrency: user.baseCurrency,
          acquisitions: useCurrencyStore.getState().allAcquisitions,
          getMarketRate,
        }).transactions
        : mergedTransactions;

      await replaceTransactions(refreshed);
      await upsertTombstones(mergedTombstones);

      let membersSummary = '';
      if (user) {
        const reconciliation = await reconcileMembersFromTransactions(
          user.id,
          refreshed,
          parsedPayload.participantProfiles,
        );

        if (reconciliation.membersAdded > 0) {
          membersSummary = ` Added ${reconciliation.membersAdded} member(s) across ${reconciliation.groupsUpdated} group(s).`;
        }
      }

      await setLastSyncedAt(Date.now());
      Alert.alert(
        'Merge complete',
        `Added ${result.added}, updated ${result.updated}, skipped ${result.skipped}. Imported ${syncedGroupsCount} group(s).${membersSummary}`,
      );
    } catch (error) {
      Alert.alert('Merge failed', error instanceof Error ? error.message : 'Invalid payload.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">QR Sync</Typography>

      <Button onPress={handleGenerate} title="Generate Payload" />
      <QRGenerator payload={generatedPayload} />

      <QRScanner
        inputLabel="Scanned or pasted sync payload"
        onChange={setIncomingPayload}
        onSubmit={() => {
          void handleMerge();
        }}
        scanTitle="Scan Sync QR"
        submitLabel="Merge Payload"
        value={incomingPayload}
      />

      {lastMergeResult ? (
        <Card>
          <Typography variant="h4">Last Merge Summary</Typography>
          <Typography variant="bodySmall">Added: {lastMergeResult.added}</Typography>
          <Typography variant="bodySmall">Updated: {lastMergeResult.updated}</Typography>
          <Typography variant="bodySmall">Skipped: {lastMergeResult.skipped}</Typography>
        </Card>
      ) : null}
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
});
