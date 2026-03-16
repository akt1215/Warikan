import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '../../constants';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption';

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const styleByVariant: Record<TypographyVariant, TextStyle> = {
  h1: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.h1 * typography.lineHeight.tight,
  },
  h2: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.h2 * typography.lineHeight.tight,
  },
  h3: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.sizes.h3 * typography.lineHeight.tight,
  },
  h4: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.sizes.h4 * typography.lineHeight.normal,
  },
  body: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.body * typography.lineHeight.normal,
  },
  bodySmall: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.bodySmall * typography.lineHeight.normal,
  },
  caption: {
    color: colors.textTertiary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    lineHeight: typography.sizes.caption * typography.lineHeight.normal,
  },
};

export const Typography = ({
  variant = 'body',
  style,
  children,
  ...textProps
}: TypographyProps): React.JSX.Element => {
  return (
    <Text {...textProps} style={[styleByVariant[variant], style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({});

void styles;

export default Typography;
