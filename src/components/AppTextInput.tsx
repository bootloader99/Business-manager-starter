import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { radius, spacing, typography, useTheme } from '../theme';

type Props = TextInputProps & {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  suffix?: string;
};

export function AppTextInput({
  label,
  required = false,
  error,
  helperText,
  suffix,
  multiline = false,
  style,
  ...textInputProps
}: Props) {
  const { theme } = useTheme();
  const palette = theme.colors;

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: palette.textPrimary }]}>
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}

      <View style={styles.inputWrapper}>
        <TextInput
          {...textInputProps}
          multiline={multiline}
          placeholderTextColor={textInputProps.placeholderTextColor ?? palette.textMuted}
          style={[
            styles.input,
            {
              borderColor: error ? palette.danger : palette.border,
              backgroundColor: palette.inputBackground,
              color: palette.textPrimary,
            },
            multiline && styles.multilineInput,
            suffix && styles.inputWithSuffix,
            style,
          ]}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {suffix ? (
          <Text style={[styles.suffix, { color: palette.textSecondary }]}>
            {suffix}
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: palette.textSecondary }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  inputWrapper: { position: 'relative' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    ...typography.body,
  },
  inputWithSuffix: { paddingRight: 42 },
  suffix: {
    position: 'absolute',
    right: 14,
    top: 14,
    ...typography.body,
  },
  multilineInput: { minHeight: 96, paddingTop: 12, paddingBottom: 12 },
  error: { ...typography.caption, marginTop: spacing.xs },
  helper: { ...typography.caption, marginTop: spacing.xs },
});
