import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import type { AddTransactionStackParamList } from './types';
import { AddTransactionScreen } from '../screens';

const Stack = createStackNavigator<AddTransactionStackParamList>();

export const AddTransactionNavigator = (): React.JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        component={AddTransactionScreen}
        name="AddTransactionForm"
        options={{ title: 'Add Transaction' }}
      />
    </Stack.Navigator>
  );
};
