import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Button, Card, Input, Picker, Typography } from '../components/common';
import { colors, formatCurrencyLabel, spacing, SUPPORTED_CURRENCIES } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { firebaseService } from '../services';
import { useCurrencyStore, useUserStore } from '../store';

export const SettingsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const refreshRates = useCurrencyStore((state) => state.refreshMarketRates);

  const [name, setName] = useState(user?.name ?? '');
  const [baseCurrency, setBaseCurrency] = useState(user?.baseCurrency ?? 'USD');
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState('');
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState('');
  const [firebaseAppId, setFirebaseAppId] = useState('');
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);
  const [isCloudToggleLoading, setIsCloudToggleLoading] = useState(true);

  const currencyOptions = useMemo(() => {
    return SUPPORTED_CURRENCIES.map((currency) => ({
      label: formatCurrencyLabel(currency),
      flagCurrency: currency,
      value: currency,
    }));
  }, []);

  const saveProfile = async (): Promise<void> => {
    if (!user) {
      return;
    }

    if (!name.trim()) {
      Alert.alert('Name required', 'Please provide a name.');
      return;
    }

    await updateProfile({
      name,
      baseCurrency,
    });

    Alert.alert('Saved', 'Profile updated.');
  };

  useEffect(() => {
    void (async () => {
      try {
        const [runtimeConfig, cloudSyncEnabled] = await Promise.all([
          firebaseService.getRuntimeConfigInput(),
          firebaseService.isCloudSyncEnabled(),
        ]);

        setIsCloudSyncEnabled(cloudSyncEnabled);

        if (!runtimeConfig) {
          return;
        }

        setFirebaseApiKey(runtimeConfig.apiKey);
        setFirebaseAuthDomain(runtimeConfig.authDomain);
        setFirebaseProjectId(runtimeConfig.projectId);
        setFirebaseStorageBucket(runtimeConfig.storageBucket);
        setFirebaseMessagingSenderId(runtimeConfig.messagingSenderId);
        setFirebaseAppId(runtimeConfig.appId);
      } finally {
        setIsCloudToggleLoading(false);
      }
    })();
  }, []);

  const toggleCloudSync = async (): Promise<void> => {
    if (isCloudToggleLoading) {
      return;
    }

    const nextEnabled = !isCloudSyncEnabled;
    try {
      await firebaseService.setCloudSyncEnabled(nextEnabled);
      setIsCloudSyncEnabled(nextEnabled);
      Alert.alert(
        nextEnabled ? 'Cloud sync enabled' : 'Cloud sync disabled',
        nextEnabled
          ? 'Firebase cloud sync is now enabled.'
          : 'Firebase calls are now skipped on this device.',
      );
    } catch (error) {
      Alert.alert(
        'Could not update cloud sync setting',
        error instanceof Error ? error.message : 'Unknown error.',
      );
    }
  };

  const saveCloudConfig = async (): Promise<void> => {
    try {
      await firebaseService.setRuntimeConfig({
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        storageBucket: firebaseStorageBucket,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId,
      });
      Alert.alert('Saved', 'Cloud config saved. You can run Cloud Sync now.');
    } catch (error) {
      Alert.alert(
        'Could not save cloud config',
        error instanceof Error ? error.message : 'Unknown error.',
      );
    }
  };

  const clearCloudConfig = async (): Promise<void> => {
    await firebaseService.clearRuntimeConfig();
    setFirebaseApiKey('');
    setFirebaseAuthDomain('');
    setFirebaseProjectId('');
    setFirebaseStorageBucket('');
    setFirebaseMessagingSenderId('');
    setFirebaseAppId('');
    Alert.alert('Cleared', 'Saved cloud config removed. Env vars still work if set.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Typography variant="h4">Profile</Typography>
        <View style={styles.cardBody}>
          <Input label="Name" onChangeText={setName} value={name} />
          <Picker
            label="Base currency"
            onValueChange={setBaseCurrency}
            options={currencyOptions}
            selectedValue={baseCurrency}
          />
          <Button onPress={() => void saveProfile()} title="Save Profile" />
        </View>
      </Card>

      <Card>
        <Typography variant="h4">Currency</Typography>
        <View style={styles.cardBody}>
          <Button
            onPress={() => {
              navigation.navigate('CurrencyWallet');
            }}
            title="My Currencies"
            variant="secondary"
          />
          <Button
            onPress={() => {
              if (!user) {
                return;
              }
              void refreshRates(user.baseCurrency);
              Alert.alert('Updated', 'Exchange rates refreshed.');
            }}
            title="Refresh Market Rates"
            variant="secondary"
          />
        </View>
      </Card>

      <Card>
        <Typography variant="h4">Cloud Sync Settings</Typography>
        <View style={styles.cardBody}>
          <Button
            disabled={isCloudToggleLoading}
            onPress={() => {
              void toggleCloudSync();
            }}
            title={
              isCloudToggleLoading
                ? 'Loading Cloud Sync...'
                : isCloudSyncEnabled
                  ? 'Disable Firebase Cloud Sync'
                  : 'Enable Firebase Cloud Sync'
            }
            variant={isCloudSyncEnabled ? 'secondary' : 'primary'}
          />
          <Typography variant="caption">
            Firebase cloud sync is currently {isCloudSyncEnabled ? 'ON' : 'OFF'} on this device.
          </Typography>
          <Typography variant="bodySmall">Cloud Sync Setup (Firebase)</Typography>
          <Typography variant="caption">
            Keep secrets out of git. Prefer `.env.local` or saving config on this device only.
          </Typography>
          <Input
            label="API Key"
            onChangeText={setFirebaseApiKey}
            value={firebaseApiKey}
          />
          <Input
            label="Auth Domain"
            onChangeText={setFirebaseAuthDomain}
            value={firebaseAuthDomain}
          />
          <Input
            label="Project ID"
            onChangeText={setFirebaseProjectId}
            value={firebaseProjectId}
          />
          <Input
            label="Storage Bucket"
            onChangeText={setFirebaseStorageBucket}
            value={firebaseStorageBucket}
          />
          <Input
            label="Messaging Sender ID"
            onChangeText={setFirebaseMessagingSenderId}
            value={firebaseMessagingSenderId}
          />
          <Input
            label="App ID"
            onChangeText={setFirebaseAppId}
            value={firebaseAppId}
          />
          <Button
            onPress={() => {
              void saveCloudConfig();
            }}
            title="Save Cloud Config"
            variant="secondary"
          />
          <Button
            onPress={() => {
              void clearCloudConfig();
            }}
            title="Clear Saved Cloud Config"
            variant="secondary"
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
  },
  cardBody: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
