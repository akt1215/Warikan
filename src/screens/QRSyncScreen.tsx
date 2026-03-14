import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { QRGenerator, QRScanner } from '../components/sync';
import { Button, Card, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import { useSyncStore, useTransactionStore, useUserStore } from '../store';

export const QRSyncScreen = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);
  const setLastSyncedAt = useUserStore((state) => state.setLastSyncedAt);

  const transactions = useTransactionStore((state) => state.transactions);
  const loadTransactions = useTransactionStore((state) => state.loadTransactions);
  const replaceTransactions = useTransactionStore((state) => state.replaceTransactions);

  const generatePayload = useSyncStore((state) => state.generatePayload);
  const mergePayload = useSyncStore((state) => state.mergePayload);
  const lastMergeResult = useSyncStore((state) => state.lastMergeResult);

  const [generatedPayload, setGeneratedPayload] = useState('');
  const [incomingPayload, setIncomingPayload] = useState('');

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const handleGenerate = (): void => {
    if (!user) {
      return;
    }

    const payload = generatePayload(user.id, transactions, user.lastSyncedAt);
    setGeneratedPayload(payload);
  };

  const handleMerge = async (): Promise<void> => {
    if (!incomingPayload.trim()) {
      Alert.alert('Payload required', 'Paste a payload first.');
      return;
    }

    try {
      const result = mergePayload(transactions, incomingPayload);
      await replaceTransactions(result.merged);
      await setLastSyncedAt(Date.now());
      Alert.alert(
        'Merge complete',
        `Added ${result.added}, updated ${result.updated}, skipped ${result.skipped}.`,
      );
    } catch (error) {
      Alert.alert('Merge failed', error instanceof Error ? error.message : 'Invalid payload.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">QR Sync</Typography>

      <Button onPress={handleGenerate} title="Generate Payload" />
      <QRGenerator payload={generatedPayload} />

      <QRScanner
        inputLabel="Scanned or pasted sync payload"
        onChange={setIncomingPayload}
        onSubmit={() => {
          void handleMerge();
        }}
        scanTitle="Scan Sync QR"
        submitLabel="Merge Payload"
        value={incomingPayload}
      />

      {lastMergeResult ? (
        <Card>
          <Typography variant="h4">Last Merge Summary</Typography>
          <Typography variant="bodySmall">Added: {lastMergeResult.added}</Typography>
          <Typography variant="bodySmall">Updated: {lastMergeResult.updated}</Typography>
          <Typography variant="bodySmall">Skipped: {lastMergeResult.skipped}</Typography>
        </Card>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
});
