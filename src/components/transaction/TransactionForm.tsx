import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { SplitType } from '../../types';
import { spacing } from '../../constants';
import { Button, Input, Picker, type PickerOption } from '../common';
import { SplitInput, type SplitInputItem } from './SplitInput';

interface TransactionFormProps {
  groupOptions: PickerOption[];
  currencyOptions: PickerOption[];
  selectedGroupId: string;
  onGroupChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  fee: string;
  onFeeChange: (value: string) => void;
  owedBy: string;
  onOwedByChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  splitType: SplitType;
  onSplitTypeChange: (value: SplitType) => void;
  customSplitValues: SplitInputItem[];
  onCustomSplitChange: (userId: string, amount: number) => void;
}

export const TransactionForm = ({
  groupOptions,
  currencyOptions,
  selectedGroupId,
  onGroupChange,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  fee,
  onFeeChange,
  owedBy,
  onOwedByChange,
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
        label="Group"
        onValueChange={onGroupChange}
        options={groupOptions}
        selectedValue={selectedGroupId}
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

      <Input
        autoCapitalize="none"
        label="Who owes (comma separated user IDs)"
        onChangeText={onOwedByChange}
        placeholder="friend-1,friend-2"
        value={owedBy}
      />

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
    gap: spacing.md,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default TransactionForm;
