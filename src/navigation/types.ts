import type { NavigatorScreenParams } from '@react-navigation/native';

export type AddTransactionStackParamList = {
  AddTransactionForm: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Groups: undefined;
  AddTransaction: undefined;
  History: undefined;
  Sync: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  GroupDetail: { groupId: string };
  TransactionDetail: { transactionId: string };
  EditTransaction: { transactionId: string };
  CurrencyWallet: undefined;
  QRSync: undefined;
};
