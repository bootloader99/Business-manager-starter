import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Routes } from '../constants';
import CustomerDetailsScreen from '../screens/Customers/CustomerDetailsScreen';
import CustomerFormScreen from '../screens/Customers/CustomerFormScreen';
import CustomersScreen from '../screens/Customers/CustomersScreen';
import { useTheme } from '../theme';
import { createStackScreenOptions } from './navigationTheme';
import type { CustomersStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomersStackParamList>();

export function CustomersStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen
        name={Routes.Customers}
        component={CustomersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.CustomerDetails}
        component={CustomerDetailsScreen}
        options={{ title: 'Customer' }}
      />
      <Stack.Screen
        name={Routes.CustomerForm}
        component={CustomerFormScreen}
        options={{ title: 'Customer' }}
      />
    </Stack.Navigator>
  );
}
