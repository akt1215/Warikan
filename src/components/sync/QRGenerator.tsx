import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

import { colors, spacing, typography } from '../../constants';
import { Button, Card } from '../common';

interface QRGeneratorProps {
  payload: string;
  title?: string;
}

export const QRGenerator = ({
  payload,
  title = 'Generated Sync Payload',
}: QRGeneratorProps): React.JSX.Element => {
  const [copied, setCopied] = useState(false);
  const normalizedPayload = payload.trim();
  const isPayloadTooLarge = normalizedPayload.length > 1800;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [copied]);

  const handleCopyPayload = async (): Promise<void> => {
    if (!normalizedPayload) {
      return;
    }

    try {
      await Clipboard.setStringAsync(normalizedPayload);
      setCopied(true);
    } catch (error) {
      Alert.alert(
        'Copy failed',
        error instanceof Error ? error.message : 'Could not copy payload.',
      );
    }
  };

  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      {!normalizedPayload ? (
        <Text style={styles.payload}>Generate payload to see QR code.</Text>
      ) : (
        <View style={styles.content}>
          {!isPayloadTooLarge ? (
            <View style={styles.qrWrap}>
              <QRCode value={normalizedPayload} size={220} />
            </View>
          ) : (
            <Text style={styles.warning}>
              Payload is too large for a single QR code. Sync in smaller batches.
            </Text>
          )}
          <ScrollView horizontal>
            <Text selectable style={styles.payload}>
              {normalizedPayload}
            </Text>
          </ScrollView>
          <Button
            onPress={() => {
              void handleCopyPayload();
            }}
            title={copied ? 'Copied' : 'Copy Payload'}
            variant="secondary"
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  qrWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
  },
  payload: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
  },
  warning: {
    color: colors.warningLight,
    fontSize: typography.sizes.bodySmall,
  },
});

export default QRGenerator;
