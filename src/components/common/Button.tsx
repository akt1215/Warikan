import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
    backgroundColor: 'rgba(124, 131, 255, 0.16)',
    borderColor: colors.buttonGlassHighlight,
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
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    borderColor: 'rgba(248, 113, 113, 0.42)',
  },
};

const textColorByVariant: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.textPrimary,
  ghost: colors.textPrimary,
  danger: colors.white,
};

const gradientByVariant: Partial<Record<ButtonVariant, readonly [string, string]>> = {
  primary: [colors.buttonGlassPrimaryStart, colors.buttonGlassPrimaryEnd],
  danger: [colors.buttonGlassDangerStart, colors.buttonGlassDangerEnd],
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: ButtonProps): React.JSX.Element => {
  const gradientColors = gradientByVariant[variant];

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
      {gradientColors ? (
        <>
          <LinearGradient
            colors={[gradientColors[0], gradientColors[1]]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[colors.buttonGlassHighlight, 'rgba(255, 255, 255, 0)']}
            end={{ x: 0.8, y: 0.8 }}
            start={{ x: 0.2, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}
      <View style={styles.content}>
        <Text
          style={[
            styles.text,
            { color: textColorByVariant[variant] },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  text: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
  },
});

export default Button;
