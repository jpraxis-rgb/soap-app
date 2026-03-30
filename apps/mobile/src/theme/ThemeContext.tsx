import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useColorScheme, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  colors: themes.dark,
  isDark: true,
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
    setMode(mode === 'dark' || (mode === 'system' && systemScheme !== 'light') ? 'light' : 'dark');
  }, [mode, systemScheme, setMode]);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme !== 'light');
  const colors = isDark ? themes.dark : themes.light;

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: themes.dark.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: themes.dark.accent, fontSize: 32, fontWeight: '800', letterSpacing: 2 }}>SOAP</Text>
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
