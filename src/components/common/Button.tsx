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

const containerStyleByVariant: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  secondary: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: '#DC2626',
  },
};

const textColorByVariant: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.textPrimary,
  ghost: colors.textPrimary,
  danger: colors.white,
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
        containerStyleByVariant[variant],
        (variant === 'primary' || variant === 'danger') && styles.raisedButton,
        pressed && !disabled && styles.pressedButton,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textColorByVariant[variant] },
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
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  raisedButton: {
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  pressedButton: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  disabledButton: {
    opacity: 0.55,
  },
  text: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
  },
});

export default Button;
