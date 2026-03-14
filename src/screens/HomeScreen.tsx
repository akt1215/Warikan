import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { BalanceOverview } from '../components/balance';
import { Card, Typography } from '../components/common';
import { TransactionCard } from '../components/transaction';
import { colors, spacing } from '../constants';
import { useBalance } from '../hooks';
import { firebaseService, refreshTransactionsForBalance } from '../services';
import { useCurrencyStore, useGroupStore, useTransactionStore, useUserStore } from '../store';
import { isTravelGroup } from '../utils';

export const HomeScreen = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const replaceTransactions = useTransactionStore((state) => state.replaceTransactions);
  const upsertTombstones = useTransactionStore((state) => state.upsertTombstones);
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const reconcileMembersFromTransactions = useGroupStore(
    (state) => state.reconcileMembersFromTransactions,
  );
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const replaceSyncedUserAcquisitions = useCurrencyStore(
    (state) => state.replaceSyncedUserAcquisitions,
  );
  const refreshMarketRates = useCurrencyStore((state) => state.refreshMarketRates);
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadGroups(user.id);
    void loadAcquisitions(user.id);
    void refreshMarketRates(user.baseCurrency);
  }, [loadAcquisitions, loadGroups, refreshMarketRates, user]);

  const balances = useBalance(user?.id ?? null, transactions);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const personNamesById = useMemo(() => {
    const map: Record<string, string> = {};

    if (user) {
      map[user.id] = user.name;
    }

    for (const group of groups) {
      for (const member of group.members) {
        const memberId = member.id.trim();
        const memberName = member.name.trim();
        if (!memberId || !memberName) {
          continue;
        }

        const existing = map[memberId];
        const existingIsPlaceholder = existing === memberId;
        const nextIsPlaceholder = memberName === memberId;

        if (!existing || (existingIsPlaceholder && !nextIsPlaceholder)) {
          map[memberId] = memberName;
        }
      }
    }

    return map;
  }, [groups, user]);

  const handleRefreshBalances = async (): Promise<void> => {
    if (!user || isRefreshingBalances) {
      return;
    }

    setIsRefreshingBalances(true);
    try {
      await loadTransactions();
      await loadGroups(user.id);
      await loadAcquisitions(user.id);
      await refreshMarketRates(user.baseCurrency);

      const latestTransactions = useTransactionStore.getState().transactions;
      const latestTombstones = useTransactionStore.getState().tombstones;
      const latestGroups = useGroupStore.getState().groups;
      const latestCurrentUserAcquisitions = useCurrencyStore.getState().acquisitions;

      const travelGroupIds = latestGroups
        .filter(isTravelGroup)
        .map((group) => group.id);

      const cloudSyncResult = await firebaseService.syncTransactions(
        latestTransactions,
        travelGroupIds,
        latestGroups,
        latestTombstones,
        user.id,
        latestCurrentUserAcquisitions,
      );
      for (const [syncedUserId, syncedAcquisitions] of Object.entries(cloudSyncResult.acquisitionsByUser)) {
        await replaceSyncedUserAcquisitions(user.id, syncedUserId, syncedAcquisitions);
      }
      const memberReconciliationResult = await reconcileMembersFromTransactions(
        user.id,
        cloudSyncResult.merged,
        cloudSyncResult.participantProfiles,
      );
      const latestAllAcquisitions = useCurrencyStore.getState().allAcquisitions;

      const refreshed = refreshTransactionsForBalance({
        transactions: cloudSyncResult.merged,
        baseCurrency: user.baseCurrency,
        acquisitions: latestAllAcquisitions,
        getMarketRate,
      });

      await replaceTransactions(refreshed.transactions);
      await upsertTombstones(cloudSyncResult.tombstones);

      Alert.alert(
        'Balances refreshed',
        `Reprocessed ${refreshed.processedCount} transaction(s), recalculated ${refreshed.recalculatedCount}, removed ${refreshed.dedupedCount} local duplicate(s), synced ${cloudSyncResult.syncedCount} cloud record(s), and added ${memberReconciliationResult.membersAdded} member(s) across ${memberReconciliationResult.groupsUpdated} group(s).`,
      );
    } catch (error) {
      Alert.alert(
        'Refresh failed',
        error instanceof Error ? error.message : 'Could not refresh balances.',
      );
    } finally {
      setIsRefreshingBalances(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BalanceOverview
        balances={balances.perPerson}
        currency={user?.baseCurrency ?? 'USD'}
        isRefreshing={isRefreshingBalances}
        onRefresh={() => {
          void handleRefreshBalances();
        }}
        personNamesById={personNamesById}
        totalOwedByYou={balances.totalOwedByYou}
        totalOwedToYou={balances.totalOwedToYou}
      />

      <Card>
        <Typography variant="h4">Recent Transactions</Typography>
        <View style={styles.list}>
          {recentTransactions.length === 0 ? (
            <Typography variant="bodySmall">No transactions yet.</Typography>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionCard
                baseCurrency={user?.baseCurrency ?? 'USD'}
                key={transaction.id}
                transaction={transaction}
              />
            ))
          )}
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
    gap: spacing.md,
    padding: spacing.md,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
