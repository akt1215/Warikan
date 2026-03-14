import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Button, Card, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useCurrencyStore, useUserStore } from '../store';
import { formatCurrency, formatTimestamp } from '../utils';

export const CurrencyWalletScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const acquisitions = useCurrencyStore((state) => state.acquisitions);
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);

  useEffect(() => {
    if (user) {
      void loadAcquisitions(user.id);
    }
  }, [loadAcquisitions, user]);

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
