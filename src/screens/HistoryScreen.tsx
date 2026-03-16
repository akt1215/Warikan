import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { TransactionCard } from '../components/transaction';
import { Button, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useTransactionStore, useUserStore } from '../store';

export const HistoryScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.list}>
        {transactions.length === 0 ? (
          <Typography variant="bodySmall">No transactions yet.</Typography>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.item}>
              <TransactionCard
                baseCurrency={user?.baseCurrency ?? 'USD'}
                onPress={() =>
                  navigation.navigate('TransactionDetail', { transactionId: transaction.id })
                }
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
    gap: spacing.lg,
    padding: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  item: {
    gap: spacing.md,
  },
});
