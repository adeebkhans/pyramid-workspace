'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type AccentMode = 'amber' | 'blue' | 'pink' | 'rose' | 'emerald' | 'black';

export const ACCENT_SWATCHES: readonly { id: AccentMode; label: string; hex: string }[] = [
  { id: 'amber', label: 'Amber', hex: '#F59E0B' },
  { id: 'blue', label: 'Blue', hex: '#3B82F6' },
  { id: 'pink', label: 'Pink', hex: '#EC4899' },
  { id: 'rose', label: 'Rose', hex: '#F43F5E' },
  { id: 'emerald', label: 'Emerald', hex: '#10B981' },
  { id: 'black', label: 'Black', hex: '#18181B' },
];

export const THEME_STORAGE_KEY = 'pyramid.theme';
export const ACCENT_STORAGE_KEY = 'pyramid.accent';

const DEFAULT_THEME: ThemeMode = 'light';
const DEFAULT_ACCENT: AccentMode = 'blue';

interface ThemeContextValue {
  theme: ThemeMode;
  accent: AccentMode;
  setTheme: (mode: ThemeMode) => void;
  setAccent: (mode: AccentMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme is applied by mutating two attributes on `<html>` — a `dark` class and
 * `data-color-mode` — which the token stylesheet keys off. Nothing re-renders
 * on a theme change; the browser simply resolves different custom properties.
 *
 * The initial paint is handled by {@link themeBootstrapScript} in the document
 * head, so a reload never flashes light before settling on dark.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [accent, setAccentState] = useState<AccentMode>(DEFAULT_ACCENT);

  useEffect(() => {
    const root = document.documentElement;
    setThemeState(root.classList.contains('dark') ? 'dark' : 'light');
    setAccentState((root.getAttribute('data-color-mode') as AccentMode) ?? DEFAULT_ACCENT);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Private browsing can refuse storage; the choice simply will not persist.
    }
  }, []);

  const setAccent = useCallback((mode: AccentMode) => {
    setAccentState(mode);
    document.documentElement.setAttribute('data-color-mode', mode);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, mode);
    } catch {
      // As above.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      accent,
      setTheme,
      setAccent,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, accent, setTheme, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

/**
 * Runs before React hydrates, in the document head. Reading localStorage
 * synchronously here is what prevents the flash of the wrong theme; it is the
 * one place a blocking inline script earns its cost.
 */
export const themeBootstrapScript = `
(function () {
  try {
    var root = document.documentElement;
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    var accent = localStorage.getItem('${ACCENT_STORAGE_KEY}') || '${DEFAULT_ACCENT}';
    if (theme === 'dark') root.classList.add('dark');
    root.setAttribute('data-color-mode', accent);
  } catch (error) {
    document.documentElement.setAttribute('data-color-mode', '${DEFAULT_ACCENT}');
  }
})();
`.trim();
