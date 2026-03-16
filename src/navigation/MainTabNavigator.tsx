import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

import { colors, spacing, typography } from '../constants';
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

const renderAndroidTabIcon = (
  routeName: keyof MainTabParamList,
  color: string,
  size: number,
  focused: boolean,
): React.JSX.Element => {
  const strokeWidth = focused ? 2.2 : 2;

  switch (routeName) {
    case 'Home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 10.5L12 3L21 10.5"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M6 9.5V21H18V9.5"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'Groups':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="17" cy="10" r="2.5" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M3.5 20C3.5 16.96 5.96 14.5 9 14.5C12.04 14.5 14.5 16.96 14.5 20"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M13 20C13 17.8 14.8 16 17 16C19.2 16 21 17.8 21 20"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'AddTransaction':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Line
            x1="12"
            y1="8"
            x2="12"
            y2="16"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <Line
            x1="8"
            y1="12"
            x2="16"
            y2="12"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'History':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Line
            x1="12"
            y1="7"
            x2="12"
            y2="12"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <Line
            x1="12"
            y1="12"
            x2="16"
            y2="14"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'Sync':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 7C18.4 4.6 15.5 3 12.2 3C8.4 3 5.2 5.2 3.8 8.4"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Polyline
            points="6 2.6 3.4 3.3 4.1 6"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Path
            d="M4 17C5.6 19.4 8.5 21 11.8 21C15.6 21 18.8 18.8 20.2 15.6"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
          <Polyline
            points="18 21.4 20.6 20.7 19.9 18"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    case 'Settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M12 2V5M12 19V22M4.9 4.9L7 7M17 17L19.1 19.1M2 12H5M19 12H22M4.9 19.1L7 17M17 7L19.1 4.9"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
          />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="2.4" fill={color} />
        </Svg>
      );
  }
};

export const MainTabNavigator = (): React.JSX.Element => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: typography.sizes.body,
          fontWeight: typography.weights.semibold,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.sizes.caption,
          fontWeight: typography.weights.semibold,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (Platform.OS === 'android') {
            return renderAndroidTabIcon(route.name, color, size, focused);
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
