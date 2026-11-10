import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';
import { AppButton } from './AppButton';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { theme, mode } = useTheme();
  const palette = theme.colors;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.68)' : 'rgba(17, 45, 37, 0.56)' }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          disabled={loading}
          accessibilityLabel="Close confirmation"
          accessibilityRole="button"
        />
        <View
          style={[styles.dialog, { backgroundColor: palette.surface, borderColor: palette.border }]}
          accessibilityRole="alert"
          accessibilityViewIsModal
        >
          <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: palette.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton title={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} style={styles.compactButton} />
            </View>
            <View style={styles.action}>
              <AppButton title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} loading={loading} titleNumberOfLines={1} style={styles.compactButton} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  dialog: { width: '100%', maxWidth: 440, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1 },
  title: { ...typography.cardTitle },
  message: { ...typography.body, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  action: { flex: 1, minWidth: 0 },
  compactButton: { paddingHorizontal: spacing.sm, width: '100%' },
});
