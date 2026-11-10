
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppButton,
  AppCard,
  ConfirmationModal,
  ScreenContainer,
  useAppToast,
} from '../../components';

import {
  createBackup,
  resetData,
  restoreBackup,
  validateBackup,
} from '../../database/repositories/dataBackupRepository';

import {
  exportBackupFile,
  importBackupFile,
} from '../../utils/backupFile';

import { radius, spacing, typography, useTheme } from '../../theme';
import type { AppTheme } from '../../theme/theme';
import { fontFamily } from '../../theme/typography';

type ConfirmationAction = 'import' | 'reset' | null;

export default function DataManagementScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] =
    useState<ConfirmationAction>(null);
  const [pendingBackup, setPendingBackup] =
    useState<ReturnType<typeof validateBackup> | null>(null);

  const { showToast } = useAppToast();

  const handleExport = async () => {
    if (exporting || importing || loading) {
      return;
    }

    try {
      setExporting(true);

      const backup = createBackup();
      await exportBackupFile(backup);

      showToast({
        message: 'Backup exported successfully. The file was saved to the location you selected.',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('cancel')
      ) {
        return;
      }

      showToast({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to export your backup.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (exporting || importing || loading) {
      return;
    }

    try {
      setImporting(true);

      const fileContents = await importBackupFile();
      const backup = validateBackup(fileContents);

      setPendingBackup(backup);
      setConfirmation('import');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('cancel')
      ) {
        return;
      }

      showToast({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to import the selected backup.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setConfirmation('reset');
  };

  const handleConfirm = async () => {
    if (loading || !confirmation) {
      return;
    }

    if (confirmation === 'import' && !pendingBackup) {
      setConfirmation(null);
      showToast({
        message: 'No valid backup is ready to import.',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      if (confirmation === 'import' && pendingBackup) {
        restoreBackup(pendingBackup);
        setConfirmation(null);
        setPendingBackup(null);

        showToast({
          message: 'Backup imported successfully.',
        });
      } else if (confirmation === 'reset') {
        resetData();
        setConfirmation(null);

        showToast({
          message: 'Business data has been reset.',
        });
      }
    } catch (error) {
      setConfirmation(null);

      showToast({
        message:
          error instanceof Error
            ? error.message
            : confirmation === 'import'
              ? 'Unable to restore the selected backup.'
              : 'Unable to reset your data.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmation = () => {
    if (loading) {
      return;
    }

    setConfirmation(null);

    if (confirmation === 'import') {
      setPendingBackup(null);
    }
  };

  const isImportConfirmation = confirmation === 'import';

  return (
    <>
      <ScreenContainer title="Data management">
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Manage your business data and backups
          </Text>

          <Text style={styles.intro}>
            Export a backup to keep a separate copy of your records, or
            restore data from a previously exported file. You can also
            reset the app's stored data.
          </Text>

          <View style={styles.section}>
            <AppCard style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>
                    Export backup
                  </Text>
                  <Text style={styles.description}>
                    Save your business records and settings to a portable
                    backup file.
                  </Text>
                </View>

                <AppButton
                  title="Export backup"
                  onPress={handleExport}
                  loading={exporting}
                  disabled={loading || exporting || importing}
                />
              </View>
            </AppCard>

            <AppCard style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>
                    Import backup
                  </Text>
                  <Text style={styles.description}>
                    Restore a previous backup. Importing replaces the
                    current business data.
                  </Text>
                </View>

                <AppButton
                  title="Import backup"
                  variant="secondary"
                  onPress={handleImport}
                  loading={importing}
                  disabled={loading || exporting || importing}
                />
              </View>
            </AppCard>
          </View>

          <View style={styles.resetSection}>
            <AppCard style={styles.dangerCard}>
              <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                  <Text style={styles.dangerTitle}>
                    Reset all data
                  </Text>
                  <Text style={styles.description}>
                    Permanently clear business records and restore default
                    business settings. Export a backup first if you may
                    need these records later.
                  </Text>
                </View>

                <AppButton
                  title="Reset data"
                  variant="danger"
                  onPress={handleReset}
                  loading={loading && confirmation === 'reset'}
                  disabled={loading || exporting || importing}
                />
              </View>
            </AppCard>
          </View>
        </View>
      </ScreenContainer>

      <ConfirmationModal
        visible={confirmation !== null}
        title={
          isImportConfirmation
            ? 'Replace current data?'
            : 'Reset all data?'
        }
        message={
          isImportConfirmation
            ? 'Importing this backup will replace all current business data. This cannot be undone.'
            : 'This will permanently remove your customers, products, sales, invoices, and payments. Business settings will be restored to their defaults.'
        }
        confirmLabel={isImportConfirmation ? 'Import' : 'Reset'}
        destructive
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={closeConfirmation}
      />
    </>
  );
}

const createStyles = (colors: AppTheme['colors']) => StyleSheet.create({
  content: {
    gap: spacing.md,
  },

  subtitle: {
    ...typography.body,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },

  intro: {
    ...typography.secondary,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  section: {
    gap: spacing.lg,
  },

  card: {
    borderRadius: radius.lg,
  },

  cardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },

  textContainer: {
    gap: spacing.xs,
  },

  resetSection: {
    marginTop: spacing.sm,
  },

  cardTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },

  description: {
    ...typography.secondary,
    color: colors.textSecondary,
  },

  dangerCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },

  dangerTitle: {
    ...typography.cardTitle,
    color: colors.danger,
  },
});


