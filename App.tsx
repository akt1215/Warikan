import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

import { colors } from './src/constants';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeDatabase } from './src/services/database';
import { useUserStore } from './src/store';

export default function App(): React.JSX.Element {
  const initializeUser = useUserStore((state) => state.initialize);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const [areIconFontsLoaded, iconFontLoadError] = useFonts(Ionicons.font);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      await initializeDatabase();
      await initializeUser();
    };

    void bootstrap();
  }, [initializeUser]);

  if (!hasHydrated || (!areIconFontsLoaded && !iconFontLoadError)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
