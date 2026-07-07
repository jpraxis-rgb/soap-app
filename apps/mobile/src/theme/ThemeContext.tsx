import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Simbolo } from '../components/Logo';
import { themes, type ThemeColors } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = '@soap_theme_mode';

export const ThemeContext = createContext<ThemeContextValue>({
  colors: themes.light,
  isDark: false,
  mode: 'system',
  setMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' || (mode === 'system' && systemScheme === 'dark') ? 'light' : 'dark');
  }, [mode, systemScheme, setMode]);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? themes.dark : themes.light;

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: themes.light.background, alignItems: 'center', justifyContent: 'center' }}>
        <Simbolo size={64} />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
