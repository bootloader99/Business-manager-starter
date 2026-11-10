
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuListItem, ScreenContainer } from '../../components';
import { Routes } from '../../constants';
import type { MoreStackParamList } from '../../navigation/types';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { fontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Settings'>;

type SettingsMenuRoute = Extract<
  keyof MoreStackParamList,
  'BusinessProfile' | 'InvoiceSettings' | 'DataManagement' | 'Appearance'
>;

const items: {
  title: string;
  description: string;
  route: SettingsMenuRoute;
}[] = [
  {
    title: 'Business profile',
    description: 'Name, logo, tax ID',
    route: Routes.BusinessProfile,
  },
  {
    title: 'Invoice settings',
    description: 'Numbering, terms, footer',
    route: Routes.InvoiceSettings,
  },
  {
    title: 'Data management',
    description: 'Backup, restore, export',
    route: Routes.DataManagement,
  },
  {
    title: 'Appearance',
    description: 'Customize how the app looks',
    route: Routes.Appearance,
  },
];

export default function SettingsScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();

  return (
    <ScreenContainer title="Settings">
      <View style={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.subtitle}>
            Configure your workspace
          </Text>

          <Text style={styles.description}>
            Manage your business details, document defaults, and stored
            data.
          </Text>
        </View>

        <View style={styles.menuList}>
          {items.map(item => (
            <MenuListItem
              key={item.route}
              title={item.title}
              description={item.description}
              iconName={item.route === Routes.Appearance ? 'palette-outline' : undefined}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  content: {
    gap: spacing.lg,
  },

  intro: {
    gap: spacing.xs,
  },

  subtitle: {
    ...typography.body,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },

  description: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  menuList: {
    gap: spacing.xs,
  },
});


