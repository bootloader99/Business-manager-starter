import { NavigationContainer } from '@react-navigation/native';
import React from 'react';

import { useTheme } from '../theme';
import { BottomTabNavigator } from './BottomTabNavigator';
import { createNavigationTheme } from './navigationTheme';

export function AppNavigator() {
  const { mode, theme } = useTheme();

  return (
    <NavigationContainer theme={createNavigationTheme(theme, mode === 'dark')}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
