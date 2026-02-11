import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { getColors, type ThemeColors } from '@/utils/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  systemScheme: ColorSchemeName;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const initialMode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const isDark = mode === 'dark';
  const colors = useMemo(() => getColors(mode), [mode]);

  const toggleMode = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors,
        setMode,
        toggleMode,
        systemScheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};
