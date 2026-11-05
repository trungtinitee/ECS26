import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'ecs_theme_preference';

/**
 * Determine if system prefers dark mode
 */
export const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get current stored theme preference (defaults to 'system' or 'light')
 */
export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'dark' || val === 'light' || val === 'system') return val;
  } catch (e) {
    // ignore
  }
  return 'light';
};

/**
 * Apply theme to document element
 */
export const applyTheme = (theme: ThemeMode): boolean => {
  if (typeof window === 'undefined') return false;
  const isDark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark());

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Update meta theme-color
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', isDark ? '#0d1511' : '#f2f6f3');

  return isDark;
};

/**
 * React hook to access and control theme
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => {
    const t = getStoredTheme();
    return t === 'dark' || (t === 'system' && getSystemPrefersDark());
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      // ignore
    }
    const appliedDark = applyTheme(newTheme);
    setIsDark(appliedDark);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  useEffect(() => {
    // Initial sync
    const initialIsDark = applyTheme(theme);
    setIsDark(initialIsDark);

    // Listen for system theme changes if mode is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (getStoredTheme() === 'system') {
        const dark = applyTheme('system');
        setIsDark(dark);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [theme]);

  return { theme, isDark, setTheme, toggleTheme };
};
