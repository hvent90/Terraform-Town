import { createContext, useContext } from 'react';
import type { Theme } from './types';

const ThemeContext = createContext<Theme>(null!);

export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemedComponents() {
  return useTheme().ui.components;
}
