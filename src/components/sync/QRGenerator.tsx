import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '../../constants';
import { Card } from '../common';

interface QRGeneratorProps {
  payload: string;
}

export const QRGenerator = ({ payload }: QRGeneratorProps): React.JSX.Element => {
  return (
    <Card>
      <Text style={styles.title}>Generated Sync Payload</Text>
      <ScrollView horizontal>
        <Text selectable style={styles.payload}>
          {payload || 'Generate payload to sync transactions.'}
        </Text>
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  payload: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
  },
});

export default QRGenerator;
