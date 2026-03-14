import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';

import { colors, spacing } from '../../constants';
import { Button, Input, Modal, Typography } from '../common';

interface QRScannerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  inputLabel?: string;
  scanTitle?: string;
}

export const QRScanner = ({
  value,
  onChange,
  onSubmit,
  submitLabel = 'Submit',
  inputLabel = 'Scanned payload',
  scanTitle = 'Scan QR Code',
}: QRScannerProps): React.JSX.Element => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const openScanner = async (): Promise<void> => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to scan QR codes.');
        return;
      }
    }

    setHasScanned(false);
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult): void => {
    if (hasScanned) {
      return;
    }

    setHasScanned(true);
    onChange(data);
    setIsScannerVisible(false);
  };

  return (
    <View style={styles.container}>
      <Input
        autoCapitalize="none"
        label={inputLabel}
        multiline
        numberOfLines={6}
        onChangeText={onChange}
        value={value}
      />
      <View style={styles.actions}>
        <Button
          onPress={() => {
            void openScanner();
          }}
          title="Scan QR Code"
          variant="secondary"
        />
        <Button onPress={onSubmit} title={submitLabel} />
      </View>

      <Modal onClose={() => setIsScannerVisible(false)} title={scanTitle} visible={isScannerVisible}>
        <View style={styles.modalContent}>
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
            style={styles.camera}
          />
          <Typography variant="bodySmall">Align the QR code inside the camera frame.</Typography>
          <Button onPress={() => setIsScannerVisible(false)} title="Close Scanner" variant="ghost" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalContent: {
    gap: spacing.sm,
  },
  camera: {
    backgroundColor: colors.black,
    borderRadius: 12,
    height: 280,
    overflow: 'hidden',
    width: '100%',
  },
});

export default QRScanner;
