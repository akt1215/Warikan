import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TransactionCard } from '../components/transaction';
import { Typography } from '../components/common';
import { colors, spacing } from '../constants';
import { useTransactionStore, useUserStore } from '../store';

export const HistoryScreen = (): React.JSX.Element => {
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">History</Typography>
      <View style={styles.list}>
        {transactions.length === 0 ? (
          <Typography variant="bodySmall">No transactions yet.</Typography>
        ) : (
          transactions.map((transaction) => (
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
    gap: spacing.md,
    padding: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
});
