import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { Button, Typography } from '../components/common';
import { TransactionForm, type SplitInputItem } from '../components/transaction';
import { CURRENCY_LABELS, colors, spacing, SUPPORTED_CURRENCIES } from '../constants';
import { convertToBaseCurrency } from '../services';
import type { SplitType } from '../types';
import {
  useCurrencyStore,
  useGroupStore,
  useTransactionStore,
  useUserStore,
} from '../store';

const parseDebtors = (raw: string, payerId: string): string[] => {
  const values = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .filter((entry) => entry !== payerId);

  return Array.from(new Set(values));
};

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const AddTransactionScreen = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const addTransaction = useTransactionStore((state) => state.addTransaction);

  const acquisitions = useCurrencyStore((state) => state.acquisitions);
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const refreshMarketRates = useCurrencyStore((state) => state.refreshMarketRates);
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(user?.baseCurrency ?? 'USD');
  const [fee, setFee] = useState('0');
  const [owedBy, setOwedBy] = useState('');
  const [note, setNote] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customSplitValues, setCustomSplitValues] = useState<SplitInputItem[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadGroups(user.id);
    void loadAcquisitions(user.id);
    void refreshMarketRates(user.baseCurrency);
  }, [loadAcquisitions, loadGroups, refreshMarketRates, user]);

  useEffect(() => {
    const firstGroup = groups[0];
    if (!selectedGroupId && firstGroup) {
      setSelectedGroupId(firstGroup.id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!user || splitType !== 'custom') {
      return;
    }

    const debtors = parseDebtors(owedBy, user.id);
    setCustomSplitValues((previous) => {
      return debtors.map((debtor) => {
        const existing = previous.find((item) => item.userId === debtor);
        return {
          userId: debtor,
          amount: existing?.amount ?? 0,
        };
      });
    });
  }, [owedBy, splitType, user]);

  const currencyOptions = useMemo(() => {
    const fromSupported = SUPPORTED_CURRENCIES.map((entry) => ({
      label: `${entry} - ${CURRENCY_LABELS[entry]}`,
      value: entry,
    }));

    const fromAcquisitions = acquisitions
      .map((entry) => entry.currency)
      .filter((entry, index, all) => all.indexOf(entry) === index)
      .filter((entry) => !SUPPORTED_CURRENCIES.includes(entry as (typeof SUPPORTED_CURRENCIES)[number]))
      .map((entry) => ({ label: entry, value: entry }));

    return [...fromSupported, ...fromAcquisitions];
  }, [acquisitions]);

  const groupOptions = useMemo(() => {
    return groups.map((group) => ({
      label: group.name,
      value: group.id,
    }));
  }, [groups]);

  const updateCustomSplit = (userId: string, splitAmount: number): void => {
    setCustomSplitValues((previous) =>
      previous.map((entry) =>
        entry.userId === userId ? { ...entry, amount: splitAmount } : entry,
      ),
    );
  };

  const resetForm = (): void => {
    setAmount('');
    setFee('0');
    setOwedBy('');
    setNote('');
    setSplitType('equal');
    setCustomSplitValues([]);
  };

  const handleSave = async (): Promise<void> => {
    if (!user) {
      return;
    }

    const parsedAmount = toNumber(amount);
    const parsedFee = toNumber(fee);

    if (!selectedGroupId) {
      Alert.alert('Group required', 'Select a group before saving.');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Amount must be greater than zero.');
      return;
    }

    const debtors = parseDebtors(owedBy, user.id);
    if (debtors.length === 0) {
      Alert.alert('Missing debtors', 'Add at least one person who owes.');
      return;
    }

    try {
      const marketRate = getMarketRate(user.baseCurrency, currency);

      const convertedAmount = convertToBaseCurrency({
        amount: parsedAmount,
        fee: parsedFee,
        fromCurrency: currency,
        baseCurrency: user.baseCurrency,
        acquisitions,
        marketRate,
      });

      const splits =
        splitType === 'equal'
          ? debtors.map((debtor) => ({
              userId: debtor,
              amount: convertedAmount / debtors.length,
              isPaid: false,
            }))
          : customSplitValues.map((entry) => ({
              userId: entry.userId,
              amount: entry.amount,
              isPaid: false,
            }));

      if (splits.some((split) => split.amount <= 0)) {
        Alert.alert('Invalid split', 'All split amounts must be greater than zero.');
        return;
      }

      await addTransaction({
        groupId: selectedGroupId,
        payerId: user.id,
        amount: parsedAmount,
        originalCurrency: currency,
        fee: parsedFee,
        convertedAmount,
        note: note.trim() || 'Expense',
        splitType,
        splits,
        createdBy: user.id,
      });

      Alert.alert('Saved', 'Transaction added successfully.');
      resetForm();
    } catch (error) {
      Alert.alert(
        'Could not save transaction',
        error instanceof Error
          ? error.message
          : 'Could not convert currency or save transaction.',
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">Add Transaction</Typography>
      <TransactionForm
        amount={amount}
        currency={currency}
        currencyOptions={currencyOptions}
        customSplitValues={customSplitValues}
        fee={fee}
        groupOptions={groupOptions}
        note={note}
        onAmountChange={setAmount}
        onCurrencyChange={setCurrency}
        onCustomSplitChange={updateCustomSplit}
        onFeeChange={setFee}
        onGroupChange={setSelectedGroupId}
        onNoteChange={setNote}
        onOwedByChange={setOwedBy}
        onSplitTypeChange={setSplitType}
        owedBy={owedBy}
        selectedGroupId={selectedGroupId}
        splitType={splitType}
      />
      <Button onPress={() => void handleSave()} title="Save Transaction" />
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
});
