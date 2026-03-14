import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Typography } from '../components/common';
import { TransactionCard } from '../components/transaction';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useGroupStore, useTransactionStore, useUserStore } from '../store';

export const GroupDetailScreen = (): React.JSX.Element => {
  const route = useRoute<RouteProp<RootStackParamList, 'GroupDetail'>>();
  const groups = useGroupStore((state) => state.groups);
  const transactions = useTransactionStore((state) => state.transactions);
  const user = useUserStore((state) => state.user);

  const group = useMemo(
    () => groups.find((entry) => entry.id === route.params.groupId),
    [groups, route.params.groupId],
  );

  const groupTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.groupId === route.params.groupId),
    [route.params.groupId, transactions],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">{group?.name ?? 'Unknown Group'}</Typography>
      <Typography variant="bodySmall">Transactions: {groupTransactions.length}</Typography>

      <View style={styles.transactionList}>
        {groupTransactions.length === 0 ? (
          <Typography variant="bodySmall">No transactions in this group yet.</Typography>
        ) : (
          groupTransactions.map((transaction) => (
            <TransactionCard
              baseCurrency={user?.baseCurrency ?? 'USD'}
              key={transaction.id}
              transaction={transaction}
            />
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
});
