import React from 'react';
import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { colors } from '../constants';
import {
  AddAcquisitionScreen,
  CurrencyWalletScreen,
  GroupDetailScreen,
  OnboardingScreen,
  QRSyncScreen,
} from '../screens';
import { useUserStore } from '../store';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
    notification: colors.secondary,
  },
};

export const RootNavigator = (): React.JSX.Element => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen component={OnboardingScreen} name="Onboarding" />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      >
        <Stack.Screen
          component={MainTabNavigator}
          name="Main"
          options={{ headerShown: false }}
        />
        <Stack.Screen component={GroupDetailScreen} name="GroupDetail" options={{ title: 'Group Detail' }} />
        <Stack.Screen
          component={CurrencyWalletScreen}
          name="CurrencyWallet"
          options={{ title: 'My Currencies' }}
        />
        <Stack.Screen
          component={AddAcquisitionScreen}
          name="AddAcquisition"
          options={{ title: 'Add Acquisition' }}
        />
        <Stack.Screen component={QRSyncScreen} name="QRSync" options={{ title: 'QR Sync' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
