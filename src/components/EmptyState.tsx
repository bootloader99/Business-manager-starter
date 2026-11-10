import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';
import { AppIcon } from './AppIcon';
import type { AppIconName } from './AppIcon';

type Props = {
  title: string;
  message: string;
  icon?: AppIconName;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onActionPress,
}: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <View style={styles.container}>
      {icon ? (
        <View style={[styles.iconContainer, { backgroundColor: palette.surfaceSage }]}>
          <AppIcon name={icon} size={24} color={palette.primary} />
        </View>
      ) : null}

      <Text style={[styles.title, { color: palette.textPrimary }]}>
        {title}
      </Text>

      <Text style={[styles.message, { color: palette.textSecondary }]}>
        {message}
      </Text>

      {actionLabel && onActionPress ? (
        <AppButton
          title={actionLabel}
          onPress={onActionPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.cardTitle,
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  action: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
});
