import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';
import { AppIcon, type AppIconName } from './AppIcon';

type Props = {
  title: string;
  description?: string;
  iconName?: AppIconName;
  onPress: () => void;
};

export function MenuListItem({ title, description, iconName, onPress }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && styles.pressed,
      ]}
    >
      {iconName ? (
        <View style={styles.leadingIcon}>
          <AppIcon name={iconName} size={22} color={palette.primary} />
        </View>
      ) : null}

      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: palette.textSecondary }]}>{description}</Text>
        ) : null}
      </View>

      <Text style={[styles.chevron, { color: palette.textSecondary }]} accessible={false}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.75 },
  leadingIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: { ...typography.body, fontFamily: typography.label.fontFamily },
  description: { ...typography.subtitle, marginTop: spacing.xs / 2 },
  chevron: {
    fontFamily: typography.body.fontFamily,
    fontSize: 22,
    lineHeight: 26,
    marginLeft: spacing.sm,
  },
});
