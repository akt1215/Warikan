import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Transaction } from '../../types';
import { colors, spacing, typography } from '../../constants';
import { formatCurrency, formatTimestamp } from '../../utils';
import { Card } from '../common';

interface TransactionCardProps {
  transaction: Transaction;
  baseCurrency: string;
}

export const TransactionCard = ({
  transaction,
  baseCurrency,
}: TransactionCardProps): React.JSX.Element => {
  return (
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
      <Text style={styles.meta}>{formatTimestamp(transaction.createdAt, 'PP p')}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  note: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.sm,
  },
  amount: {
    color: colors.primaryLight,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    marginTop: spacing.xs,
  },
});

export default TransactionCard;
