import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants';
import { formatCurrency } from '../../utils';
import { Card } from '../common';
import { PersonBalance } from './PersonBalance';

interface BalanceOverviewProps {
  balances: Record<string, number>;
  totalOwedByYou: number;
  totalOwedToYou: number;
  currency: string;
}

export const BalanceOverview = ({
  balances,
  totalOwedByYou,
  totalOwedToYou,
  currency,
}: BalanceOverviewProps): React.JSX.Element => {
  return (
    <Card>
      <Text style={styles.title}>Balance Overview</Text>
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
              personId={personId}
            />
          ))
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
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
