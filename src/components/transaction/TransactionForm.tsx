import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { SplitType } from '../../types';
import { spacing } from '../../constants';
import { Button, Input, Picker, type PickerOption, Typography } from '../common';
import { SplitInput, type SplitInputItem } from './SplitInput';

interface TransactionFormProps {
  groupOptions: PickerOption[];
  labelOptions: PickerOption[];
  currencyOptions: PickerOption[];
  selectedGroupId: string;
  selectedLabel: string;
  onGroupChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  fee: string;
  onFeeChange: (value: string) => void;
  payerOptions: PickerOption[];
  selectedPayerId: string;
  onPayerChange: (payerId: string) => void;
  debtorOptions: PickerOption[];
  selectedDebtorIds: string[];
  onToggleDebtor: (memberId: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  splitType: SplitType;
  onSplitTypeChange: (value: SplitType) => void;
  customSplitValues: SplitInputItem[];
  onCustomSplitChange: (userId: string, amount: number) => void;
}

export const TransactionForm = ({
  groupOptions,
  labelOptions,
  currencyOptions,
  selectedGroupId,
  selectedLabel,
  onGroupChange,
  onLabelChange,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  fee,
  onFeeChange,
  payerOptions,
  selectedPayerId,
  onPayerChange,
  debtorOptions,
  selectedDebtorIds,
  onToggleDebtor,
  note,
  onNoteChange,
  splitType,
  onSplitTypeChange,
  customSplitValues,
  onCustomSplitChange,
}: TransactionFormProps): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <Picker
        label="Travel Group"
        onValueChange={onGroupChange}
        options={groupOptions}
        selectedValue={selectedGroupId}
      />

      <Picker
        label="Expense Label"
        onValueChange={onLabelChange}
        options={labelOptions}
        selectedValue={selectedLabel}
      />

      <Input
        keyboardType="decimal-pad"
        label="Amount"
        onChangeText={onAmountChange}
        value={amount}
      />

      <Picker
        label="Currency"
        onValueChange={onCurrencyChange}
        options={currencyOptions}
        selectedValue={currency}
      />

      <Input
        keyboardType="decimal-pad"
        label="Fee (optional)"
        onChangeText={onFeeChange}
        value={fee}
      />

      <View style={styles.debtorsSection}>
        <Typography variant="bodySmall">Who paid</Typography>
        <View style={styles.debtorOptions}>
          {payerOptions.map((option) => (
            <Button
              key={option.value}
              onPress={() => onPayerChange(option.value)}
              title={option.label}
              variant={selectedPayerId === option.value ? 'primary' : 'secondary'}
            />
          ))}
        </View>
      </View>

      <View style={styles.debtorsSection}>
        <Typography variant="bodySmall">Who owes</Typography>
        <View style={styles.debtorOptions}>
          {debtorOptions.length === 0 ? (
            <Typography variant="caption">
              No people in this travel group yet. Add members in the Travel tab first.
            </Typography>
          ) : (
            debtorOptions.map((option) => (
              <Button
                key={option.value}
                onPress={() => onToggleDebtor(option.value)}
                title={option.label}
                variant={selectedDebtorIds.includes(option.value) ? 'primary' : 'secondary'}
              />
            ))
          )}
        </View>
      </View>

      <View style={styles.splitTypeRow}>
        <Button
          onPress={() => onSplitTypeChange('equal')}
          title="Equal Split"
          variant={splitType === 'equal' ? 'primary' : 'secondary'}
        />
        <Button
          onPress={() => onSplitTypeChange('custom')}
          title="Custom Split"
          variant={splitType === 'custom' ? 'primary' : 'secondary'}
        />
      </View>

      {splitType === 'custom' ? (
        <SplitInput onAmountChange={onCustomSplitChange} values={customSplitValues} />
      ) : null}

      <Input
        label="Note"
        onChangeText={onNoteChange}
        placeholder="What was this for?"
        value={note}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  debtorsSection: {
    gap: spacing.xs,
  },
  debtorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

export default TransactionForm;
