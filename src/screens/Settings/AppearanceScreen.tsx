import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard, AppIcon, ScreenContainer } from '../../components';
import {
  darkColors,
  lightColors,
  spacing,
  typography,
  useTheme,
  type ThemePreference,
} from '../../theme';

type ThemePreviewProps = {
  title: string;
  description: string;
  mode: ThemePreference;
  selected: boolean;
  onSelect: (mode: ThemePreference) => void;
};

function ThemePreview({
  title,
  description,
  mode,
  selected,
  onSelect,
}: ThemePreviewProps) {
  const { theme } = useTheme();
  // The miniature previews intentionally show each theme's own palette.
  const palette = mode === 'dark' ? darkColors : lightColors;

  return (
    <Pressable
      onPress={() => onSelect(mode)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title} theme`}
    >
      <AppCard
        style={[
          styles.optionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: selected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
      >
        <View style={styles.optionRow}>
          <View
            style={[
              styles.previewFrame,
              { borderColor: theme.colors.border },
            ]}
          >
            {mode === 'system' ? (
              <View style={styles.splitPreview}>
                <View
                  style={[
                    styles.previewHalf,
                    { backgroundColor: lightColors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.previewHeader,
                      { backgroundColor: lightColors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewLine,
                      { backgroundColor: lightColors.border },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.previewHalf,
                    { backgroundColor: darkColors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.previewHeader,
                      { backgroundColor: darkColors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewLine,
                      { backgroundColor: darkColors.border },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.previewHalf,
                  { backgroundColor: palette.background },
                ]}
              >
                <View
                  style={[
                    styles.previewHeader,
                    { backgroundColor: palette.primary },
                  ]}
                />
                <View
                  style={[
                    styles.previewLine,
                    { backgroundColor: palette.border },
                  ]}
                />
                <View
                  style={[
                    styles.previewCard,
                    { backgroundColor: palette.surface },
                  ]}
                />
              </View>
            )}
          </View>

          <View style={styles.optionText}>
            <Text
              style={[
                styles.optionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              {description}
            </Text>
          </View>

          {selected && (
            <AppIcon
              name="check-circle"
              size={22}
              color={theme.colors.primary}
            />
          )}
        </View>
      </AppCard>
    </Pressable>
  );
}

export default function AppearanceScreen() {
  const { preference, setThemePreference, theme } = useTheme();

  return (
    <ScreenContainer title="Appearance">
      <View style={styles.content}>
        <View style={styles.intro}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Theme
          </Text>
          <Text
            style={[
              styles.supportingText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Choose how Business Manager looks on your device.
          </Text>
        </View>

        <View style={styles.options}>
          <ThemePreview
            title="Light"
            description="Warm ivory surfaces and forest-green accents."
            mode="light"
            selected={preference === 'light'}
            onSelect={setThemePreference}
          />
          <ThemePreview
            title="Dark"
            description="Deep green-tinted surfaces and warm ivory text."
            mode="dark"
            selected={preference === 'dark'}
            onSelect={setThemePreference}
          />
          <ThemePreview
            title="System default"
            description="Follow your phone's light or dark setting."
            mode="system"
            selected={preference === 'system'}
            onSelect={setThemePreference}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  intro: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.section,
  },
  supportingText: {
    ...typography.secondary,
  },
  options: {
    gap: spacing.sm,
  },
  optionCard: {
    padding: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewFrame: {
    width: 76,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  splitPreview: {
    flex: 1,
    flexDirection: 'row',
  },
  previewHalf: {
    flex: 1,
    padding: 6,
    gap: 5,
  },
  previewHeader: {
    height: 7,
    borderRadius: 2,
  },
  previewLine: {
    height: 4,
    width: '72%',
    borderRadius: 2,
  },
  previewCard: {
    height: 17,
    borderRadius: 3,
  },
  optionText: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    ...typography.cardTitle,
  },
  optionDescription: {
    ...typography.secondary,
  },
});
