import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants';
import { formatCurrency } from '../../utils';
import { Button, Card } from '../common';
import { PersonBalance } from './PersonBalance';

interface BalanceOverviewProps {
  balances: Record<string, number>;
  personNamesById?: Record<string, string>;
  totalOwedByYou: number;
  totalOwedToYou: number;
  currency: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BalanceOverview = ({
  balances,
  personNamesById = {},
  totalOwedByYou,
  totalOwedToYou,
  currency,
  onRefresh,
  isRefreshing = false,
}: BalanceOverviewProps): React.JSX.Element => {
  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Balance Overview</Text>
        {onRefresh ? (
          <Button
            onPress={onRefresh}
            title={isRefreshing ? 'Refreshing...' : 'Refresh'}
            variant="secondary"
          />
        ) : null}
      </View>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.label}>You owe</Text>
          <Text style={[styles.value, styles.negative]}>
            {formatCurrency(totalOwedByYou, currency)}
          </Text>
        </View>
        <View>
          <Text style={styles.label}>Owed to you</Text>
          <Text style={[styles.value, styles.positive]}>
            {formatCurrency(totalOwedToYou, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        {Object.entries(balances).length === 0 ? (
          <Text style={styles.empty}>No balances yet.</Text>
        ) : (
          Object.entries(balances).map(([personId, amount]) => (
            <PersonBalance
              amount={amount}
              currency={currency}
              key={personId}
              personName={personNamesById[personId] ?? personId}
            />
          ))
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.semibold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
  },
  value: {
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  positive: {
    color: colors.successLight,
  },
  negative: {
    color: colors.dangerLight,
  },
  listContainer: {
    marginTop: spacing.md,
  },
  empty: {
    color: colors.textTertiary,
    fontSize: typography.sizes.bodySmall,
  },
});

export default BalanceOverview;
