import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Transaction } from '../../types';
import { colors, spacing, typography } from '../../constants';
import { formatCurrency, formatTimestamp } from '../../utils';
import { Card } from '../common';

interface TransactionCardProps {
  transaction: Transaction;
  baseCurrency: string;
  onPress?: () => void;
}

export const TransactionCard = ({
  transaction,
  baseCurrency,
  onPress,
}: TransactionCardProps): React.JSX.Element => {
  const content = (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.note}>{transaction.note || 'Untitled expense'}</Text>
        <Text style={styles.amount}>{formatCurrency(transaction.convertedAmount, baseCurrency)}</Text>
      </View>
      <Text style={styles.meta}>
        Original: {formatCurrency(transaction.amount + transaction.fee, transaction.originalCurrency)}
      </Text>
      <Text style={styles.meta}>Label: {transaction.label}</Text>
      <Text style={styles.meta}>Payer: {transaction.payerId}</Text>
      <Text style={styles.meta}>
        {formatTimestamp(transaction.occurredAt || transaction.createdAt, 'PP p')}
      </Text>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  note: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.sm,
  },
  amount: {
    color: colors.primaryLight,
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.bold,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    marginTop: spacing.xs,
    lineHeight: typography.sizes.bodySmall * typography.lineHeight.normal,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});

export default TransactionCard;
