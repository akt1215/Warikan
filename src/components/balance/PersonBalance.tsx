import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../constants';
import { formatCurrency } from '../../utils';

interface PersonBalanceProps {
  personId: string;
  amount: number;
  currency: string;
}

export const PersonBalance = ({
  personId,
  amount,
  currency,
}: PersonBalanceProps): React.JSX.Element => {
  const isPositive = amount >= 0;

  return (
    <View style={styles.row}>
      <Text style={styles.person}>{personId}</Text>
      <Text style={[styles.amount, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? 'They owe you' : 'You owe'} {formatCurrency(Math.abs(amount), currency)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  person: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
  amount: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.semibold,
  },
  positive: {
    color: colors.successLight,
  },
  negative: {
    color: colors.dangerLight,
  },
});

export default PersonBalance;
