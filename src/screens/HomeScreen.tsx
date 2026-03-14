import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BalanceOverview } from '../components/balance';
import { Card, Typography } from '../components/common';
import { TransactionCard } from '../components/transaction';
import { colors, spacing } from '../constants';
import { useBalance } from '../hooks';
import { useTransactionStore, useUserStore } from '../store';

export const HomeScreen = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const balances = useBalance(user?.id ?? null, transactions);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BalanceOverview
        balances={balances.perPerson}
        currency={user?.baseCurrency ?? 'USD'}
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
