import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme, View } from 'react-native';

import { db } from '../database/database';
import { darkTheme, lightTheme, type AppTheme } from './theme';
import { darkColors, lightColors } from './colors';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  mode: ResolvedThemeMode;
  theme: AppTheme;
  isReady: boolean;
  setThemePreference: (preference: ThemePreference) => void;
};

type ThemeProviderProps = PropsWithChildren<{
  storageReady: boolean;
}>;

const THEME_PREFERENCE_KEY = 'appearance.theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({ children, storageReady }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    let active = true;

    const loadPreference = async () => {
      try {
        const result = await db.execute(
          'SELECT value FROM app_preferences WHERE key = ? LIMIT 1',
          [THEME_PREFERENCE_KEY],
        );
        const savedValue = result.rows[0]?.value;

        if (active && isThemePreference(savedValue)) {
          setPreference(savedValue);
        }
      } catch (error) {
        console.error('Theme preference could not be loaded:', error);
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    void loadPreference();

    return () => {
      active = false;
    };
  }, [storageReady]);

  const setThemePreference = useCallback((nextPreference: ThemePreference) => {
    setPreference(nextPreference);

    void db.execute(
      `INSERT INTO app_preferences (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [THEME_PREFERENCE_KEY, nextPreference],
    ).catch(error => {
      console.error('Theme preference could not be saved:', error);
    });
  }, []);

  const mode: ResolvedThemeMode =
    preference === 'system'
      ? systemColorScheme === 'dark' ? 'dark' : 'light'
      : preference;

  const theme = mode === 'dark' ? darkTheme : lightTheme;
  const fallbackBackground =
    systemColorScheme === 'dark'
      ? darkColors.background
      : lightColors.background;

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, mode, theme, isReady, setThemePreference }),
    [preference, mode, theme, isReady, setThemePreference],
  );

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: fallbackBackground }} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }

  return context;
}
