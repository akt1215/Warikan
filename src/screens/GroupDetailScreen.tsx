import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Button, Typography } from '../components/common';
import { TransactionCard } from '../components/transaction';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useGroupStore, useTransactionStore, useUserStore } from '../store';

export const GroupDetailScreen = (): React.JSX.Element => {
  const route = useRoute<RouteProp<RootStackParamList, 'GroupDetail'>>();
  const groups = useGroupStore((state) => state.groups);
  const refreshGroupMembers = useGroupStore((state) => state.refreshGroupMembers);
  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const user = useUserStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const group = useMemo(
    () => groups.find((entry) => entry.id === route.params.groupId),
    [groups, route.params.groupId],
  );

  const groupTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.groupId === route.params.groupId),
    [route.params.groupId, transactions],
  );

  const handleRefreshMembers = async (): Promise<void> => {
    if (!user || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      const result = await refreshGroupMembers(user.id, route.params.groupId);

      if (!result.group) {
        Alert.alert('Refresh failed', 'Could not find this group anymore.');
      } else if (!result.cloudSynced) {
        Alert.alert(
          'Refreshed locally',
          'Cloud sync is not configured, so members were refreshed from local data only.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Refresh failed',
        error instanceof Error ? error.message : 'Could not refresh members.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">{group?.name ?? 'Unknown Group'}</Typography>
      <Typography variant="bodySmall">Transactions: {groupTransactions.length}</Typography>
      <Typography variant="bodySmall">
        People:{' '}
        {group?.members.length
          ? group.members.map((member) => member.name).join(', ')
          : 'No members yet'}
      </Typography>
      <Button
        onPress={() => {
          void handleRefreshMembers();
        }}
        title={isRefreshing ? 'Refreshing Members...' : 'Refresh Members'}
        variant="secondary"
      />

      <View style={styles.transactionList}>
        {groupTransactions.length === 0 ? (
          <Typography variant="bodySmall">No transactions in this group yet.</Typography>
        ) : (
          groupTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <TransactionCard
                baseCurrency={user?.baseCurrency ?? 'USD'}
                transaction={transaction}
              />
              {user && transaction.createdBy === user.id ? (
                <Button
                  onPress={() => {
                    Alert.alert(
                      'Delete transaction?',
                      'This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            void (async () => {
                              try {
                                await deleteTransaction(transaction.id, user.id);
                              } catch (error) {
                                Alert.alert(
                                  'Could not delete',
                                  error instanceof Error ? error.message : 'Unknown error.',
                                );
                              }
                            })();
                          },
                        },
                      ],
                    );
                  }}
                  title="Delete"
                  variant="danger"
                />
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  transactionList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  transactionItem: {
    gap: spacing.sm,
  },
});
