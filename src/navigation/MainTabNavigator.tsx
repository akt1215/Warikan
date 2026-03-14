import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from '../constants';
import {
  GroupsScreen,
  HistoryScreen,
  HomeScreen,
  SettingsScreen,
} from '../screens';
import { AddTransactionNavigator } from './AddTransactionNavigator';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = (): React.JSX.Element => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
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
      }}
    >
      <Tab.Screen component={HomeScreen} name="Home" />
      <Tab.Screen component={GroupsScreen} name="Groups" />
      <Tab.Screen
        component={AddTransactionNavigator}
        name="AddTransaction"
        options={{ title: 'Add' }}
      />
      <Tab.Screen component={HistoryScreen} name="History" />
      <Tab.Screen component={SettingsScreen} name="Settings" />
    </Tab.Navigator>
  );
};
