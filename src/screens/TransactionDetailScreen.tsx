import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

import { Button, Card, Typography } from '../components/common';
import { colors, spacing, typography } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import type { Group } from '../types';
import { useGroupStore, useTransactionStore, useUserStore } from '../store';
import { formatCurrency, formatTimestamp } from '../utils';

const buildPersonNamesById = (
  userId: string | null,
  userName: string | null,
  groups: ReadonlyArray<Group>,
): Record<string, string> => {
  const map: Record<string, string> = {};

  if (userId && userName) {
    map[userId] = userName;
  }

  for (const group of groups) {
    for (const member of group.members) {
      const memberId = member.id.trim();
      const memberName = member.name.trim();
      if (!memberId || !memberName) {
        continue;
      }

      map[memberId] = memberName;
    }
  }

  return map;
};

export const TransactionDetailScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionDetail'>>();
  const transactions = useTransactionStore((state) => state.transactions);
  const groups = useGroupStore((state) => state.groups);
  const user = useUserStore((state) => state.user);

  const transaction = useMemo(
    () => transactions.find((entry) => entry.id === route.params.transactionId) ?? null,
    [route.params.transactionId, transactions],
  );

  const group = useMemo(() => {
    if (!transaction) {
      return null;
    }

    return groups.find((entry) => entry.id === transaction.groupId) ?? null;
  }, [groups, transaction]);

  const personNamesById = useMemo(() => {
    return buildPersonNamesById(user?.id ?? null, user?.name ?? null, groups);
  }, [groups, user?.id, user?.name]);

  if (!transaction) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Typography variant="h3">Transaction detail</Typography>
        <Typography variant="bodySmall">
          This transaction could not be found. It may have been deleted or not loaded yet.
        </Typography>
      </ScrollView>
    );
  }

  const baseCurrency = user?.baseCurrency ?? 'USD';
  const totalPaidOriginal = transaction.amount + transaction.fee;
  const totalOwed = transaction.splits.reduce((sum, split) => sum + split.amount, 0);
  const payerShare = Math.max(transaction.convertedAmount - totalOwed, 0);
  const canEdit = user?.id === transaction.createdBy;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">{transaction.note || 'Transaction detail'}</Typography>
      {canEdit ? (
        <Button
          onPress={() =>
            navigation.navigate('EditTransaction', { transactionId: transaction.id })
          }
          style={styles.editButton}
          title="Edit Transaction"
          variant="secondary"
        />
      ) : null}

      <Card>
        <Typography variant="caption">Total paid</Typography>
        <Typography variant="h2">
          {formatCurrency(totalPaidOriginal, transaction.originalCurrency)}
        </Typography>
        <Typography variant="bodySmall">
          Converted total: {formatCurrency(transaction.convertedAmount, baseCurrency)}
        </Typography>
        {transaction.fee > 0 ? (
          <Typography variant="caption">
            Includes fee: {formatCurrency(transaction.fee, transaction.originalCurrency)}
          </Typography>
        ) : null}
      </Card>

      <Card>
        <Typography variant="h4">Details</Typography>
        <View style={styles.detailList}>
          <View style={styles.detailRow}>
            <Typography variant="caption">Group</Typography>
            <Typography variant="bodySmall">{group?.name ?? transaction.groupId}</Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="caption">Label</Typography>
            <Typography variant="bodySmall">{transaction.label}</Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="caption">Payer</Typography>
            <Typography variant="bodySmall">
              {personNamesById[transaction.payerId] ?? transaction.payerId}
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="caption">Split type</Typography>
            <Typography variant="bodySmall">
              {transaction.splitType === 'equal' ? 'Equal split' : 'Custom split'}
            </Typography>
          </View>
          <View style={styles.detailRow}>
            <Typography variant="caption">Date</Typography>
            <Typography variant="bodySmall">
              {formatTimestamp(transaction.createdAt, 'PP p')}
            </Typography>
          </View>
        </View>
      </Card>

      <Card>
        <Typography variant="h4">Who owes how much</Typography>
        <View style={styles.splitList}>
          {transaction.splits.length === 0 ? (
            <Typography variant="bodySmall">No split rows on this transaction.</Typography>
          ) : (
            transaction.splits.map((split) => (
              <View key={split.userId} style={styles.splitRow}>
                <View style={styles.splitNameColumn}>
                  <Typography variant="body">{personNamesById[split.userId] ?? split.userId}</Typography>
                  <Typography variant="caption">{split.isPaid ? 'Paid' : 'Unpaid'}</Typography>
                </View>
                <Typography style={styles.splitAmount} variant="body">
                  {formatCurrency(split.amount, baseCurrency)}
                </Typography>
              </View>
            ))
          )}
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Typography variant="bodySmall">Total owed by participants</Typography>
          <Typography variant="bodySmall">{formatCurrency(totalOwed, baseCurrency)}</Typography>
        </View>
        <View style={styles.summaryRow}>
          <Typography variant="bodySmall">Payer share</Typography>
          <Typography variant="bodySmall">{formatCurrency(payerShare, baseCurrency)}</Typography>
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
    gap: spacing.lg,
    padding: spacing.md,
  },
  detailList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  splitList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  splitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitNameColumn: {
    gap: spacing.xs,
  },
  splitAmount: {
    color: colors.primaryLight,
    fontWeight: typography.weights.semibold,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
});

export default TransactionDetailScreen;
