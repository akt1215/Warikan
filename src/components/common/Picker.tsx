import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants';

export interface PickerOption {
  label: string;
  value: string;
}

interface PickerProps {
  label?: string;
  options: PickerOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export const Picker = ({
  label,
  options,
  selectedValue,
  onValueChange,
}: PickerProps): React.JSX.Element => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.optionContainer}>
        {options.map((option) => {
          const selected = option.value === selectedValue;

          return (
            <Pressable
              key={option.value}
              onPress={() => onValueChange(option.value)}
              style={[styles.option, selected && styles.selectedOption]}
            >
              <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
  selectedOptionText: {
    color: colors.white,
  },
});

export default Picker;
