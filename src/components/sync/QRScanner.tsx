import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants';
import { Button, Input } from '../common';

interface QRScannerProps {
  value: string;
  onChange: (value: string) => void;
  onMerge: () => void;
}

export const QRScanner = ({
  value,
  onChange,
  onMerge,
}: QRScannerProps): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <Input
        autoCapitalize="none"
        label="Paste scanned payload"
        multiline
        numberOfLines={6}
        onChangeText={onChange}
        value={value}
      />
      <Button onPress={onMerge} title="Merge Payload" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
});

export default QRScanner;
