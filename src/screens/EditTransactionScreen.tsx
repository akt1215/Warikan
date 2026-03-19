import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

import { AddTransactionScreen } from './AddTransactionScreen';
import type { RootStackParamList } from '../navigation/types';

export const EditTransactionScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditTransaction'>>();

  return (
    <AddTransactionScreen
      editTransactionId={route.params.transactionId}
      onSaved={() => navigation.goBack()}
    />
  );
};

export default EditTransactionScreen;
