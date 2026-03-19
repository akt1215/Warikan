import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { Button, Typography } from '../components/common';
import { TransactionForm, type SplitInputItem } from '../components/transaction';
import {
  colors,
  DEFAULT_TRANSACTION_LABEL,
  formatCurrencyLabel,
  spacing,
  SUPPORTED_CURRENCIES,
  TRANSACTION_LABELS,
} from '../constants';
import { convertToBaseCurrency } from '../services';
import type { Group, SplitType, TransactionEditableInput } from '../types';
import {
  useCurrencyStore,
  useGroupStore,
  useTransactionStore,
  useUserStore,
} from '../store';
import { isTravelGroup } from '../utils';

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPreferredTravelGroupId = (travelGroups: ReadonlyArray<Group>): string => {
  const defaultGroup = travelGroups.reduce<Group | null>((latest, group) => {
    if (!group.isDefault) {
      return latest;
    }

    if (!latest || group.updatedAt > latest.updatedAt) {
      return group;
    }

    return latest;
  }, null);

  return defaultGroup?.id ?? travelGroups[0]?.id ?? '';
};

interface AddTransactionScreenProps {
  editTransactionId?: string;
  onSaved?: () => void;
}

export const AddTransactionScreen = ({
  editTransactionId,
  onSaved,
}: AddTransactionScreenProps = {}): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const transactions = useTransactionStore((state) => state.transactions);
  const isTransactionsLoading = useTransactionStore((state) => state.isLoading);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const acquisitions = useCurrencyStore((state) => state.acquisitions);
  const allAcquisitions = useCurrencyStore((state) => state.allAcquisitions);
  const loadAcquisitions = useCurrencyStore((state) => state.loadAcquisitions);
  const refreshMarketRates = useCurrencyStore((state) => state.refreshMarketRates);
  const getMarketRate = useCurrencyStore((state) => state.getMarketRate);

  const isEditing = Boolean(editTransactionId);

  const editingTransaction = useMemo(() => {
    if (!editTransactionId) {
      return null;
    }

    return transactions.find((entry) => entry.id === editTransactionId) ?? null;
  }, [editTransactionId, transactions]);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string>(DEFAULT_TRANSACTION_LABEL);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<string>(user?.baseCurrency ?? 'USD');
  const [fee, setFee] = useState('0');
  const [selectedPayerId, setSelectedPayerId] = useState('');
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customSplitValues, setCustomSplitValues] = useState<SplitInputItem[]>([]);
  const [isEditFormInitialized, setIsEditFormInitialized] = useState(false);
  const [hasRequestedEditLoad, setHasRequestedEditLoad] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadGroups(user.id);
    void loadAcquisitions(user.id);
    void refreshMarketRates(user.baseCurrency);
  }, [loadAcquisitions, loadGroups, refreshMarketRates, user]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    setHasRequestedEditLoad(true);
    void loadTransactions();
  }, [isEditing, loadTransactions]);

  useEffect(() => {
    setIsEditFormInitialized(false);
  }, [editTransactionId]);

  const travelGroups = useMemo(() => {
    return groups.filter(isTravelGroup);
  }, [groups]);

  useEffect(() => {
    if (travelGroups.length === 0) {
      if (selectedGroupId && !isEditing) {
        setSelectedGroupId('');
      }
      return;
    }

    if (!travelGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(getPreferredTravelGroupId(travelGroups));
    }
  }, [isEditing, selectedGroupId, travelGroups]);

  useEffect(() => {
    if (!isEditing || !editingTransaction || isEditFormInitialized) {
      return;
    }

    setSelectedGroupId(editingTransaction.groupId);
    setSelectedLabel(editingTransaction.label.trim() || DEFAULT_TRANSACTION_LABEL);
    setAmount(String(editingTransaction.amount));
    setCurrency(editingTransaction.originalCurrency);
    setFee(String(editingTransaction.fee));
    setSelectedPayerId(editingTransaction.payerId);
    setSelectedDebtorIds(editingTransaction.splits.map((split) => split.userId));
    setNote(editingTransaction.note);
    setSplitType(editingTransaction.splitType);
    setCustomSplitValues(
      editingTransaction.splitType === 'custom'
        ? editingTransaction.splits.map((split) => ({
            userId: split.userId,
            label: split.userId,
            amount: split.amount,
          }))
        : [],
    );
    setIsEditFormInitialized(true);
  }, [editingTransaction, isEditFormInitialized, isEditing]);

  const currencyOptions = useMemo(() => {
    const fromSupported = SUPPORTED_CURRENCIES.map((entry) => ({
      label: formatCurrencyLabel(entry),
      flagCurrency: entry,
      value: entry,
    }));

    const dynamicCurrencies = Array.from(new Set([
      ...acquisitions.map((entry) => entry.currency),
      currency,
    ]));

    const fromAcquisitions = dynamicCurrencies
      .filter(Boolean)
      .filter((entry) => !SUPPORTED_CURRENCIES.includes(entry as (typeof SUPPORTED_CURRENCIES)[number]))
      .map((entry) => ({ label: formatCurrencyLabel(entry), value: entry }));

    return [...fromSupported, ...fromAcquisitions];
  }, [acquisitions, currency]);

  const labelOptions = useMemo(() => {
    return TRANSACTION_LABELS.map((entry) => ({
      label: entry,
      value: entry,
    }));
  }, []);

  const groupOptions = useMemo(() => {
    return travelGroups.map((group) => ({
      label: group.name,
      value: group.id,
    }));
  }, [travelGroups]);

  const selectedGroup = useMemo(() => {
    return travelGroups.find((group) => group.id === selectedGroupId) ?? null;
  }, [selectedGroupId, travelGroups]);

  const payerOptions = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    return selectedGroup.members.map((member) => ({
      label: member.name,
      value: member.id,
    }));
  }, [selectedGroup]);

  const debtorOptions = useMemo(() => {
    if (!selectedGroup) {
      return [];
    }

    return selectedGroup.members
      .filter((member) => member.id !== selectedPayerId)
      .map((member) => ({
        label: member.name,
        value: member.id,
      }));
  }, [selectedGroup, selectedPayerId]);

  const debtorLabelById = useMemo(() => {
    return Object.fromEntries(
      debtorOptions.map((option) => [option.value, option.label]),
    ) as Record<string, string>;
  }, [debtorOptions]);

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedPayerId('');
      return;
    }

    const groupMemberIds = selectedGroup.members.map((member) => member.id);
    if (groupMemberIds.includes(selectedPayerId)) {
      return;
    }

    const defaultPayerId =
      user && groupMemberIds.includes(user.id)
        ? user.id
        : selectedGroup.members[0]?.id ?? '';

    setSelectedPayerId(defaultPayerId);
  }, [selectedGroup, selectedPayerId, user]);

  useEffect(() => {
    const validIds = new Set(debtorOptions.map((option) => option.value));
    const allDebtors = debtorOptions.map((option) => option.value);
    setSelectedDebtorIds((previous) => {
      const filtered = previous.filter((id) => validIds.has(id));

      if (filtered.length === 0) {
        return allDebtors;
      }

      if (
        filtered.length === previous.length &&
        filtered.every((id, index) => id === previous[index])
      ) {
        return previous;
      }

      return filtered;
    });
  }, [debtorOptions]);

  useEffect(() => {
    setCustomSplitValues((previous) =>
      previous.map((item) => ({
        ...item,
        label: debtorLabelById[item.userId] ?? item.label,
      })),
    );
  }, [debtorLabelById]);

  useEffect(() => {
    if (splitType !== 'custom') {
      return;
    }

    setCustomSplitValues((previous) => {
      return selectedDebtorIds.map((debtor) => {
        const existing = previous.find((item) => item.userId === debtor);
        return {
          userId: debtor,
          label: existing?.label ?? debtorLabelById[debtor] ?? debtor,
          amount: existing?.amount ?? 0,
        };
      });
    });
  }, [debtorLabelById, selectedDebtorIds, splitType]);

  const updateCustomSplit = (userId: string, splitAmount: number): void => {
    setCustomSplitValues((previous) =>
      previous.map((entry) =>
        entry.userId === userId ? { ...entry, amount: splitAmount } : entry,
      ),
    );
  };

  const toggleDebtor = (debtorId: string): void => {
    setSelectedDebtorIds((previous) => {
      if (previous.includes(debtorId)) {
        return previous.filter((entry) => entry !== debtorId);
      }

      return [...previous, debtorId];
    });
  };

  const handlePayerChange = (payerId: string): void => {
    setSelectedPayerId(payerId);
    setSelectedDebtorIds((previous) => {
      const filtered = previous.filter((id) => id !== payerId);
      if (filtered.length > 0) {
        return filtered;
      }

      return debtorOptions
        .filter((option) => option.value !== payerId)
        .map((option) => option.value);
    });
    setCustomSplitValues([]);
  };

  const handleGroupChange = (groupId: string): void => {
    setSelectedGroupId(groupId);
    const nextGroup = travelGroups.find((group) => group.id === groupId);
    const defaultPayer =
      nextGroup && user && nextGroup.members.some((member) => member.id === user.id)
        ? user.id
        : nextGroup?.members[0]?.id ?? '';

    const defaultDebtors = nextGroup
      ? nextGroup.members
          .filter((member) => member.id !== defaultPayer)
          .map((member) => member.id)
      : [];

    setSelectedPayerId(defaultPayer);
    setSelectedDebtorIds(defaultDebtors);
    setCustomSplitValues([]);
  };

  const resetForm = (): void => {
    setAmount('');
    setFee('0');
    setSelectedDebtorIds([]);
    setNote('');
    setSplitType('equal');
    setCustomSplitValues([]);
  };

  const handleSave = async (): Promise<void> => {
    if (!user) {
      return;
    }

    if (isEditing && !editingTransaction) {
      Alert.alert('Missing transaction', 'The transaction could not be loaded for editing.');
      return;
    }

    if (isEditing && editingTransaction?.createdBy !== user.id) {
      Alert.alert('Not allowed', 'You can only edit transactions you created.');
      return;
    }

    const parsedAmount = toNumber(amount);
    const parsedFee = toNumber(fee);

    if (!selectedGroupId) {
      Alert.alert('Travel group required', 'Select a travel group before saving.');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Amount must be greater than zero.');
      return;
    }

    if (
      !selectedPayerId ||
      !selectedGroup?.members.some((member) => member.id === selectedPayerId)
    ) {
      Alert.alert('Payer required', 'Select a valid payer from this group.');
      return;
    }

    const debtors = Array.from(new Set(selectedDebtorIds)).filter(
      (debtorId) => debtorId !== selectedPayerId,
    );
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
        acquisitions: allAcquisitions,
        acquisitionOwnerId: selectedPayerId,
        marketRate,
      });

      const customSplits = customSplitValues
        .filter((entry) => debtors.includes(entry.userId))
        .map((entry) => ({
          userId: entry.userId,
          amount: entry.amount,
          isPaid: false,
        }));

      if (splitType === 'custom') {
        if (customSplits.length !== debtors.length) {
          Alert.alert('Invalid split', 'Enter a custom split amount for every selected debtor.');
          return;
        }

        const customTotal = customSplits.reduce((sum, split) => sum + split.amount, 0);
        if (customTotal > convertedAmount + 1e-9) {
          Alert.alert('Invalid split', 'Custom split total cannot exceed the transaction amount.');
          return;
        }
      }

      const splits =
        splitType === 'equal'
          ? debtors.map((debtor) => ({
              userId: debtor,
              amount: convertedAmount / (debtors.length + 1),
              isPaid: false,
            }))
          : customSplits;

      if (splits.some((split) => split.amount <= 0)) {
        Alert.alert('Invalid split', 'All split amounts must be greater than zero.');
        return;
      }

      const transactionInput: TransactionEditableInput = {
        groupId: selectedGroupId,
        label: selectedLabel,
        payerId: selectedPayerId,
        amount: parsedAmount,
        originalCurrency: currency,
        fee: parsedFee,
        convertedAmount,
        note: note.trim() || 'Expense',
        splitType,
        splits,
      };

      if (isEditing && editingTransaction) {
        await updateTransaction(editingTransaction.id, transactionInput, user.id);
        Alert.alert('Saved', 'Transaction updated successfully.');
        onSaved?.();
        return;
      }

      await addTransaction({
        ...transactionInput,
        createdBy: user.id,
      });

      Alert.alert('Saved', 'Transaction added successfully.');
      resetForm();
    } catch (error) {
      Alert.alert(
        isEditing ? 'Could not update transaction' : 'Could not save transaction',
        error instanceof Error
          ? error.message
          : 'Could not convert currency or save transaction.',
      );
    }
  };

  if (isEditing && !editingTransaction) {
    const isLoadingEditTransaction = !hasRequestedEditLoad || isTransactionsLoading;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Typography variant="h4">
          {isLoadingEditTransaction ? 'Loading transaction...' : 'Transaction unavailable'}
        </Typography>
        <Typography variant="bodySmall">
          {isLoadingEditTransaction
            ? 'Please wait while we load the transaction details.'
            : 'This transaction could not be found. It may have been deleted already.'}
        </Typography>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TransactionForm
        amount={amount}
        currency={currency}
        currencyOptions={currencyOptions}
        customSplitValues={customSplitValues}
        fee={fee}
        groupOptions={groupOptions}
        labelOptions={labelOptions}
        note={note}
        onAmountChange={setAmount}
        onCurrencyChange={setCurrency}
        onCustomSplitChange={updateCustomSplit}
        onPayerChange={handlePayerChange}
        onToggleDebtor={toggleDebtor}
        onFeeChange={setFee}
        onGroupChange={handleGroupChange}
        onLabelChange={setSelectedLabel}
        onNoteChange={setNote}
        onSplitTypeChange={setSplitType}
        debtorOptions={debtorOptions}
        payerOptions={payerOptions}
        selectedGroupId={selectedGroupId}
        selectedLabel={selectedLabel}
        selectedDebtorIds={selectedDebtorIds}
        selectedPayerId={selectedPayerId}
        splitType={splitType}
      />
      <Button onPress={() => void handleSave()} title={isEditing ? 'Save Changes' : 'Save Transaction'} />
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
});
