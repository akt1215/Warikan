import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants';
import {
  GroupsScreen,
  HistoryScreen,
  HomeScreen,
  SettingsScreen,
  SyncScreen,
} from '../screens';
import { AddTransactionNavigator } from './AddTransactionNavigator';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getIosTabIconName = (
  routeName: keyof MainTabParamList,
  focused: boolean,
): React.ComponentProps<typeof Ionicons>['name'] => {
  switch (routeName) {
    case 'Home':
      return focused ? 'home' : 'home-outline';
    case 'Groups':
      return focused ? 'airplane' : 'airplane-outline';
    case 'AddTransaction':
      return focused ? 'add-circle' : 'add-circle-outline';
    case 'History':
      return focused ? 'time' : 'time-outline';
    case 'Sync':
      return focused ? 'sync' : 'sync-outline';
    case 'Settings':
      return focused ? 'settings' : 'settings-outline';
    default:
      return focused ? 'ellipse' : 'ellipse-outline';
  }
};

const getAndroidTabSymbol = (
  routeName: keyof MainTabParamList,
): string => {
  switch (routeName) {
    case 'Home':
      return '⌂';
    case 'Groups':
      return '✈';
    case 'AddTransaction':
      return '⊕';
    case 'History':
      return '◷';
    case 'Sync':
      return '↻';
    case 'Settings':
      return '⚙';
    default:
      return '•';
  }
};

export const MainTabNavigator = (): React.JSX.Element => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size, focused }) => {
          if (Platform.OS === 'android') {
            return (
              <View style={styles.androidIconWrapper}>
                <Text
                  style={[
                    styles.androidIconSymbol,
                    {
                      color,
                      fontSize: focused ? size + 1 : size,
                    },
                  ]}
                >
                  {getAndroidTabSymbol(route.name)}
                </Text>
              </View>
            );
          }

          return <Ionicons color={color} name={getIosTabIconName(route.name, focused)} size={size} />;
        },
      })}
    >
      <Tab.Screen component={HomeScreen} name="Home" />
      <Tab.Screen
        component={GroupsScreen}
        name="Groups"
        options={{ title: 'Travel Groups', tabBarLabel: 'Travel' }}
      />
      <Tab.Screen
        component={AddTransactionNavigator}
        name="AddTransaction"
        options={{ title: 'Add' }}
      />
      <Tab.Screen component={HistoryScreen} name="History" />
      <Tab.Screen component={SyncScreen} name="Sync" />
      <Tab.Screen component={SettingsScreen} name="Settings" />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  androidIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 24,
  },
  androidIconSymbol: {
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
