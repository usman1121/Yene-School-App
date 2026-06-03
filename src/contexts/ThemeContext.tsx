import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/lib/storage';
import { lightColors, darkColors, ThemeColors } from '@/theme/colors';
import { userAPI } from '@/lib/api/auth';
import { useAuth } from './AuthContext';

type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const { user, updateUser } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>('SYSTEM');

  useEffect(() => {
    storage.getItem('theme').then((saved) => {
      if (saved === 'LIGHT' || saved === 'DARK' || saved === 'SYSTEM') {
        setModeState(saved);
      }
    }).catch(() => {});
  }, []);

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    await storage.setItem('theme', next);
    try {
      const res = await userAPI.updateTheme(next);
      if (res?.data?.id && user) {
        updateUser({ ...user, theme: next });
      } else if (user) {
        updateUser({ ...user, theme: next });
      }
    } catch {}
  };

  const resolvedTheme = mode === 'SYSTEM'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : mode === 'DARK' ? 'dark' : 'light';

  const isDark = resolvedTheme === 'dark';
  const currentColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors: currentColors, isDark, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
