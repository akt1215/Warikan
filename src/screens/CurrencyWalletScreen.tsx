import React, { useEffect, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Typography } from '../components/common';
import { colors, spacing, SUPPORTED_CURRENCIES } from '../constants';
import { refreshTransactionsForBalance } from '../services';
import { useCurrencyStore, useTransactionStore, useUserStore } from '../store';
import { formatCurrency, formatTimestamp } from '../utils';

export const CurrencyWalletScreen = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const acquisitions = useCurrencyStore((state) => state.acquisitions);
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const deleteAcquisition = useCurrencyStore((state) => state.deleteAcquisition);
  const refreshMarketRates = useCurrencyStore((state) => state.refreshMarketRates);
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);
  const marketRates = useCurrencyStore((state) => state.marketRates);
  const ratesUpdatedAt = useCurrencyStore((state) => state.ratesUpdatedAt);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const replaceTransactions = useTransactionStore((state) => state.replaceTransactions);

  useEffect(() => {
    if (user) {
      void loadAcquisitions(user.id);
      void refreshMarketRates(user.baseCurrency);
    }
  }, [loadAcquisitions, refreshMarketRates, user]);

  const rateRows = useMemo(() => {
    if (!user) {
      return [];
    }

    const currencies = Array.from(
      new Set([
        ...SUPPORTED_CURRENCIES,
        ...(user.favoriteCurrencies ?? []),
        ...acquisitions.map((entry) => entry.currency),
      ]),
    ).filter((currency) => currency !== user.baseCurrency);

    return currencies
      .map((currency) => ({
        currency,
        rate: marketRates[currency],
      }))
      .filter((row) => typeof row.rate === 'number' && row.rate > 0);
  }, [acquisitions, marketRates, user]);

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

      <Card>
        <Typography variant="h4">Market rates</Typography>
        <Typography variant="caption">
          Last updated: {ratesUpdatedAt ? formatTimestamp(ratesUpdatedAt, 'PP p') : 'Not updated yet'}
        </Typography>
        <Typography variant="caption">
          Market rates are cached for up to 12 hours. Refresh may use the latest cached data.
        </Typography>
        <View style={styles.rateList}>
          {rateRows.length === 0 ? (
            <Typography variant="bodySmall">
              No rates loaded yet. Tap refresh to load market rates (cache can be used for up to 12
              hours).
            </Typography>
          ) : (
            rateRows.map((row) => (
              <View key={row.currency} style={styles.rateRow}>
                <Typography variant="bodySmall">
                  {row.currency} → {user?.baseCurrency ?? 'USD'}
                </Typography>
                <Typography variant="bodySmall">{row.rate?.toFixed(4)}</Typography>
              </View>
            ))
          )}
        </View>
        <Button
          onPress={() => {
            if (!user) {
              return;
            }
            void (async () => {
              await refreshMarketRates(user.baseCurrency);
              Alert.alert(
                'Updated',
                'Exchange rates refreshed. If updated within 12 hours, this may use cached latest data.',
              );
            })();
          }}
          title="Refresh Market Rates"
          variant="secondary"
        />
      </Card>

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
    gap: spacing.lg,
    padding: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  rateList: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  rateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
