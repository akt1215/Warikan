import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants';
import { Input } from '../common';

export interface SplitInputItem {
  userId: string;
  label: string;
  amount: number;
}

interface SplitInputProps {
  values: SplitInputItem[];
  onAmountChange: (userId: string, amount: number) => void;
}

export const SplitInput = ({
  values,
  onAmountChange,
}: SplitInputProps): React.JSX.Element => {
  return (
    <View style={styles.container}>
      {values.map((item) => (
        <Input
          key={item.userId}
          keyboardType="decimal-pad"
          label={`Amount for ${item.label}`}
          onChangeText={(text) => onAmountChange(item.userId, Number(text) || 0)}
          value={item.amount ? String(item.amount) : ''}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});

export default SplitInput;
