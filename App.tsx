import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppToastProvider } from './src/components';
import { runMigrations } from './src/database';
import { seedDemoData } from './src/database/seed/demoData';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme';

function AppContent() {
  const { mode } = useTheme();

  return (
    <AppToastProvider>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      />
      <AppNavigator />
    </AppToastProvider>
  );
}

function App() {
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await runMigrations();
        seedDemoData();
      } catch (error) {
        console.error('Database initialization failed:', error);
      } finally {
        setDatabaseReady(true);
      }
    };

    void initializeDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider storageReady={databaseReady}>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
