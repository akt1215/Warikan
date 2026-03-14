import type { NavigatorScreenParams } from '@react-navigation/native';

export type AddTransactionStackParamList = {
  AddTransactionForm: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  AddTransaction: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  GroupDetail: { groupId: string };
  CurrencyWallet: undefined;
  AddAcquisition: undefined;
  QRSync: undefined;
};
