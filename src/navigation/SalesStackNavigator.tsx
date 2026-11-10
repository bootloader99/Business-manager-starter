import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Routes } from '../constants';
import {CreateSaleScreen} from '../screens/Sales/CreateSaleScreen';
import SaleDetailsScreen from '../screens/Sales/SaleDetailsScreen';
import SalesScreen from '../screens/Sales/SalesScreen';
import { useTheme } from '../theme';
import { createStackScreenOptions } from './navigationTheme';
import type { SalesStackParamList } from './types';

const Stack = createNativeStackNavigator<SalesStackParamList>();

export function SalesStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={createStackScreenOptions(theme)}>
      <Stack.Screen
        name={Routes.Sales}
        component={SalesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Routes.SaleDetails}
        component={SaleDetailsScreen}
        options={{ title: 'Sale details' }}
      />
      <Stack.Screen
        name={Routes.CreateSale}
        component={CreateSaleScreen}
        options={{ title: 'New sale' }}
      />
    </Stack.Navigator>
  );
}
