import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';

import { colors, formatCurrencyLabel, spacing, SUPPORTED_CURRENCIES } from '../constants';
import { Button, Input, Picker, Typography } from '../components/common';
import { useGroupStore, useUserStore } from '../store';

const currencyOptions = SUPPORTED_CURRENCIES.map((currency) => ({
  label: formatCurrencyLabel(currency),
  flagCurrency: currency,
  value: currency,
}));

export const OnboardingScreen = (): React.JSX.Element => {
  const createUser = useUserStore((state) => state.createUser);
  const loadGroups = useGroupStore((state) => state.loadGroups);

  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your display name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await createUser(name, baseCurrency);
      await loadGroups(user.id);
    } catch (error) {
      Alert.alert('Setup failed', error instanceof Error ? error.message : 'Could not finish onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h2">Welcome to Warikan</Typography>
        <Typography style={styles.subtitle} variant="bodySmall">
          Split expenses with friends in multiple currencies.
        </Typography>

        <Input
          autoCapitalize="words"
          label="Your name"
          onChangeText={setName}
          placeholder="Enter your name"
          value={name}
        />

        <Picker
          label="Base currency"
          onValueChange={setBaseCurrency}
          options={currencyOptions}
          selectedValue={baseCurrency}
        />

        <Button
          disabled={isSubmitting}
          onPress={handleSubmit}
          title={isSubmitting ? 'Setting up...' : 'Start Using Warikan'}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
});
