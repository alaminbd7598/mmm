import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'maharat_model_madrasah_theme';
/** Key used by earlier versions; still read so returning visitors keep their light / dark choice. */
const LEGACY_THEME_STORAGE_KEY = 'craft_international_institute_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyThemeToDOM = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
  root.setAttribute('data-theme', mode);
  root.style.colorScheme = mode;
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_THEME_STORAGE_KEY) ||
      localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      applyThemeToDOM(saved);
      return saved;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: ThemeMode = prefersDark ? 'dark' : 'light';
    applyThemeToDOM(initial);
    return initial;
  } catch {
    return 'light';
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    applyThemeToDOM(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      localStorage.setItem('theme', nextTheme);
    } catch {
      // Ignore storage quota errors
    }
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      applyThemeToDOM(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        localStorage.setItem('theme', next);
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
