import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button, Input, Picker, Typography } from '../components/common';
import { CURRENCY_LABELS, colors, spacing, SUPPORTED_CURRENCIES } from '../constants';
import { useCurrencyStore, useUserStore } from '../store';

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const AddAcquisitionScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);
  const addAcquisition = useCurrencyStore((state) => state.addAcquisition);

  const [currency, setCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [note, setNote] = useState('');

  const currencyOptions = useMemo(() => {
    return SUPPORTED_CURRENCIES.map((entry) => ({
      label: `${entry} - ${CURRENCY_LABELS[entry]}`,
      value: entry,
    }));
  }, []);

  const handleSave = async (): Promise<void> => {
    if (!user) {
      return;
    }

    const parsedAmount = toNumber(amount);
    const parsedPaidAmount = toNumber(paidAmount);

    if (parsedAmount <= 0 || parsedPaidAmount <= 0) {
      Alert.alert('Invalid values', 'Amount and paid amount must be greater than zero.');
      return;
    }

    try {
      await addAcquisition(user.id, {
        currency,
        amount: parsedAmount,
        paidAmount: parsedPaidAmount,
        acquiredAt: Date.now(),
        note: note.trim() || undefined,
      });

      Alert.alert('Saved', 'Currency acquisition added.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">Add Acquisition</Typography>

      <Picker
        label="Currency"
        onValueChange={setCurrency}
        options={currencyOptions}
        selectedValue={currency}
      />

      <Input keyboardType="decimal-pad" label="Amount received" onChangeText={setAmount} value={amount} />
      <Input
        keyboardType="decimal-pad"
        label={`Amount paid (${user?.baseCurrency ?? 'USD'})`}
        onChangeText={setPaidAmount}
        value={paidAmount}
      />
      <Input label="Note (optional)" onChangeText={setNote} value={note} />

      <Button onPress={() => void handleSave()} title="Save Acquisition" />
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
