import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from './AppIcon';
import { radius, spacing, typography, useTheme } from '../theme';

type ToastType = 'success' | 'error' | 'info';
type ToastOptions = { message: string; type?: ToastType; duration?: number };
type ToastData = ToastOptions & { id: number };
type ToastContextValue = { showToast: (options: ToastOptions) => void; dismissToast: () => void };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function AppToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const [toast, setToast] = useState<ToastData | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((options: ToastOptions) => {
    setToast({
      ...options,
      type: options.type ?? 'success',
      duration: options.duration ?? 2800,
      id: Date.now(),
    });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => {
      setToast(current => current?.id === toast.id ? null : current);
    }, toast.duration);
    return () => clearTimeout(timeout);
  }, [toast]);

  const contextValue = React.useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  const iconName = toast?.type === 'error' ? 'alert-circle'
    : toast?.type === 'info' ? 'information'
    : 'check-circle';
  const accentColor = toast?.type === 'error' ? palette.danger
    : toast?.type === 'info' ? palette.primary
    : palette.success;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
          <Pressable
            onPress={dismissToast}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.toast, { backgroundColor: palette.surface, borderColor: palette.border, borderLeftColor: accentColor }]}
          >
            <AppIcon name={iconName} size={22} color={accentColor} />
            <Text style={[styles.message, { color: palette.textPrimary }]}>{toast.message}</Text>
          </Pressable>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useAppToast must be used within AppToastProvider.');
  return context;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 9999, elevation: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radius.md,
    elevation: 4,
  },
  message: { flex: 1, ...typography.secondary },
});
