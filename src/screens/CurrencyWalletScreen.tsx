import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Button, Card, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { refreshTransactionsForBalance } from '../services';
import { useCurrencyStore, useTransactionStore, useUserStore } from '../store';
import { formatCurrency, formatTimestamp } from '../utils';

export const CurrencyWalletScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const acquisitions = useCurrencyStore((state) => state.acquisitions);
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const deleteAcquisition = useCurrencyStore((state) => state.deleteAcquisition);
  const refreshMarketRates = useCurrencyStore((state) => state.refreshMarketRates);
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const replaceTransactions = useTransactionStore((state) => state.replaceTransactions);

  useEffect(() => {
    if (user) {
      void loadAcquisitions(user.id);
    }
  }, [loadAcquisitions, user]);

  const handleDeleteAcquisition = async (acquisitionId: string): Promise<void> => {
    if (!user) {
      return;
    }

    try {
      await deleteAcquisition(user.id, acquisitionId);
      await loadTransactions();
      await refreshMarketRates(user.baseCurrency);

      const latestTransactions = useTransactionStore.getState().transactions;
      const latestAcquisitions = useCurrencyStore.getState().allAcquisitions;
      const refreshed = refreshTransactionsForBalance({
        transactions: latestTransactions,
        baseCurrency: user.baseCurrency,
        acquisitions: latestAcquisitions,
        getMarketRate,
      });

      await replaceTransactions(refreshed.transactions);
      Alert.alert(
        'Deleted',
        `Acquisition removed. Recalculated ${refreshed.recalculatedCount} transaction(s).`,
      );
    } catch (error) {
      Alert.alert('Could not delete', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">My Currencies</Typography>

      <Button
        onPress={() => {
          navigation.navigate('AddAcquisition');
        }}
        title="Add Acquisition"
      />

      <View style={styles.list}>
        {acquisitions.length === 0 ? (
          <Typography variant="bodySmall">No acquisitions logged yet.</Typography>
        ) : (
          acquisitions.map((acquisition) => (
            <Card key={acquisition.id}>
              <Typography variant="h4">{acquisition.currency}</Typography>
              <Typography variant="bodySmall">
                Received {formatCurrency(acquisition.amount, acquisition.currency)}
              </Typography>
              <Typography variant="bodySmall">
                Paid {formatCurrency(acquisition.paidAmount, user?.baseCurrency ?? 'USD')}
              </Typography>
              <Typography variant="bodySmall">Rate: {acquisition.rate.toFixed(4)}</Typography>
              <Typography variant="caption">{formatTimestamp(acquisition.acquiredAt, 'PP p')}</Typography>
              <Button
                onPress={() => {
                  Alert.alert(
                    'Delete acquisition?',
                    'This will update balances using the new average rate.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          void handleDeleteAcquisition(acquisition.id);
                        },
                      },
                    ],
                  );
                }}
                title="Delete"
                variant="danger"
              />
            </Card>
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
