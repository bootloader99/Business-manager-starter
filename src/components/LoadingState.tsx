import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '../theme';

type Props = { fullscreen?: boolean };

export function LoadingState({ fullscreen = false }: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;
  return (
    <View
      style={[
        styles.container,
        fullscreen && styles.fullscreen,
        fullscreen && { backgroundColor: palette.background },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator size="small" color={palette.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  fullscreen: { flex: 1 },
});
