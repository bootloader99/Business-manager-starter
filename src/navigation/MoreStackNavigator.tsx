import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Routes } from '../constants';
import CreateInvoiceScreen from '../screens/Invoices/CreateInvoiceScreen';
import InvoiceDetailsScreen from '../screens/Invoices/InvoiceDetailsScreen';
import RecordPaymentScreen from '../screens/Invoices/RecordPaymentScreen';
import InvoicesScreen from '../screens/Invoices/InvoicesScreen';
import MoreScreen from '../screens/More/MoreScreen';
import ProductDetailsScreen from '../screens/Products/ProductDetailsScreen';
import ProductFormScreen from '../screens/Products/ProductFormScreen';
import ProductsScreen from '../screens/Products/ProductsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import BusinessProfileScreen from '../screens/Settings/BusinessProfileScreen';
import DataManagementScreen from '../screens/Settings/DataManagementScreen';
import InvoiceSettingsScreen from '../screens/Settings/InvoiceSettingsScreen';
import AppearanceScreen from '../screens/Settings/AppearanceScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

import { useTheme } from '../theme';
import { createStackScreenOptions } from './navigationTheme';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={{
      ...createStackScreenOptions(theme),
      headerShown: false,
    }}>
      <Stack.Screen
        name={Routes.More}
        component={MoreScreen}
      />
      <Stack.Screen
        name={Routes.Products}
        component={ProductsScreen}
      />
      <Stack.Screen
        name={Routes.ProductDetails}
        component={ProductDetailsScreen}
      />
      <Stack.Screen
        name={Routes.ProductForm}
        component={ProductFormScreen}
      />
      <Stack.Screen
        name={Routes.Invoices}
        component={InvoicesScreen}
      />
      <Stack.Screen
        name={Routes.InvoiceDetails}
        component={InvoiceDetailsScreen}
      />
      <Stack.Screen
        name={Routes.CreateInvoice}
        component={CreateInvoiceScreen}
      />
      <Stack.Screen
        name={Routes.RecordPayment}
        component={RecordPaymentScreen}
      />
      <Stack.Screen
        name={Routes.Reports}
        component={ReportsScreen}
      />
      <Stack.Screen
        name={Routes.Settings}
        component={SettingsScreen}
      />
      <Stack.Screen
        name={Routes.BusinessProfile}
        component={BusinessProfileScreen}
      />
      <Stack.Screen
        name={Routes.InvoiceSettings}
        component={InvoiceSettingsScreen}
      />
      <Stack.Screen
        name={Routes.DataManagement}
        component={DataManagementScreen}
      />
      <Stack.Screen
        name={Routes.Appearance}
        component={AppearanceScreen}
      />
    </Stack.Navigator>
  );
}
