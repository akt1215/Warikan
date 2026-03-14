import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Button, Card, Input, Picker, Typography } from '../components/common';
import { CURRENCY_LABELS, colors, spacing, SUPPORTED_CURRENCIES } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useCurrencyStore, useUserStore } from '../store';

export const SettingsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = useUserStore((state) => state.user);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const refreshRates = useCurrencyStore((state) => state.refreshMarketRates);

  const [name, setName] = useState(user?.name ?? '');
  const [baseCurrency, setBaseCurrency] = useState(user?.baseCurrency ?? 'USD');

  const currencyOptions = useMemo(() => {
    return SUPPORTED_CURRENCIES.map((currency) => ({
      label: `${currency} - ${CURRENCY_LABELS[currency]}`,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">Settings</Typography>

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
        <Typography variant="h4">Sync</Typography>
        <View style={styles.cardBody}>
          <Button
            onPress={() => {
              navigation.navigate('QRSync');
            }}
            title="QR Sync"
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
    gap: spacing.md,
    padding: spacing.md,
  },
  cardBody: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
