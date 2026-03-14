import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const backgroundByVariant: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surfaceLight,
  ghost: colors.transparent,
  danger: colors.danger,
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps): React.JSX.Element => {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: backgroundByVariant[variant],
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === 'ghost' && styles.ghostButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'ghost' && styles.ghostText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ghostButton: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  text: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
  },
  ghostText: {
    color: colors.textPrimary,
  },
});

export default Button;
