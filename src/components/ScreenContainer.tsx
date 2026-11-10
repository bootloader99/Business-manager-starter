import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from './AppIcon';
import { radius, spacing, typography, useTheme } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  showBackButton?: boolean;
};

export function ScreenContainer({
  title,
  subtitle,
  children,
  scroll = true,
  contentStyle,
  showBackButton: showBackButtonOverride,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  // Only show Back when this screen's own navigator has a previous route.
  // canGoBack() can bubble to a parent navigator and show Back on stack roots.
  const showBackButton =
    showBackButtonOverride ?? (navigation.getState()?.index ?? 0) > 0;
  const palette = theme.colors;

  const body = children ?? (
    <Text style={[styles.placeholder, { color: palette.textSecondary }]}>
      Content coming soon.
    </Text>
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: palette.headerBackground,
            borderBottomColor: palette.headerDivider,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {showBackButton ? (
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              android_ripple={{ color: palette.border, borderless: true }}
            >
              <AppIcon name="arrow-left" size={22} color={palette.headerForeground} />
            </Pressable>
          ) : null}

          <View style={styles.heading}>
            <Text
              style={[styles.title, { color: palette.headerForeground }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>

            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: palette.textSecondary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {scroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.contentStatic, contentStyle]}>
          {body}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  heading: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { ...typography.title },
  subtitle: { ...typography.secondary, marginTop: spacing.xs },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.md },
  contentStatic: { flex: 1 },
  placeholder: { ...typography.body },
});
