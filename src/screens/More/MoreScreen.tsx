import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuListItem, ScreenContainer } from '../../components';
import { Routes } from '../../constants';
import type { MoreStackParamList } from '../../navigation/types';
import { spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'More'>;

type MoreMenuRoute = Extract<
  keyof MoreStackParamList,
  | 'Products'
  | 'Invoices'
  | 'Reports'
  | 'Settings'
>;

const menuSections: {
  title: string;
  description: string;
  route: MoreMenuRoute;
}[] = [
    {
      title: 'Products',
      description: 'Manage products and stock',
      route: Routes.Products,
    },
    {
      title: 'Invoices',
      description: 'View and manage invoices',
      route: Routes.Invoices,
    },
    {
      title: 'Reports',
      description: 'Review business performance',
      route: Routes.Reports,
    },
    {
      title: 'Settings',
      description: 'Business profile and preferences',
      route: Routes.Settings,
    },
  ];

export default function MoreScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const navigation = useNavigation<Nav>();

  return (
    <ScreenContainer
      title="More"
      showBackButton
    >
      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Business tools</Text>
          <Text style={styles.sectionSubtitle}>
            Manage your products, finances, and business preferences.
          </Text>
        </View>
        <View style={styles.menuList}>
          {menuSections.map(item => (
            <MenuListItem
              key={item.route}
              title={item.title}
              description={item.description}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    paddingLeft: spacing.xs,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  menuList: {
    gap: spacing.xs,
    marginTop:5
  },
});

