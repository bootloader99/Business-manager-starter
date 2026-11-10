import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Routes } from '../constants';
import { AppIcon } from '../components';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import { spacing, typography, useTheme } from '../theme';
import { CustomersStackNavigator } from './CustomersStackNavigator';
import { MoreStackNavigator } from './MoreStackNavigator';
import { SalesStackNavigator } from './SalesStackNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();



export function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarHideOnKeyboard: true,

        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
          lineHeight: 15,
          marginTop: 2,
          marginBottom: 2,
        },

        tabBarIconStyle: {
          marginTop: 3,
        },

        tabBarItemStyle: {
          paddingVertical: spacing.xs,
        },

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          height: 58 + insets.bottom,
          paddingTop: spacing.xs,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
        },
      }}
    >
      <Tab.Screen
        name={Routes.Dashboard}
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <AppIcon
              name="home-outline"
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name={Routes.SalesTab}
        component={SalesStackNavigator}
        options={{
          title: 'Sales',
          tabBarIcon: ({ color }) => (
            <AppIcon
              name="receipt-text-outline"
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name={Routes.CustomersTab}
        component={CustomersStackNavigator}
        options={{
          title: 'Customers',
          tabBarIcon: ({ color }) => (
            <AppIcon
              name="account-group-outline"
              size={23}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name={Routes.MoreTab}
        component={MoreStackNavigator}
        options={{
          title: 'More',
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => (
            <AppIcon
              name="dots-horizontal"
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}