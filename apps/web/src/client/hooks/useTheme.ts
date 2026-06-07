import { useEffect, useRef, useState } from 'react';
import { getMyBoTeam } from '@/config/myboteam';
import { applyTheme as applyLibTheme } from '@/utils/theme';
import {
  applyColorTheme,
  COLOR_THEME_KEY,
  isValidColor,
  type ThemeColor,
} from '@/utils/theme-color';

type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme';

function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {}
  return 'system';
}

function resolveIsDark(preference: ThemePreference): boolean {
  if (preference === 'dark') {
    return true;
  }
  if (preference === 'light') {
    return false;
  }
  try {
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  } catch {
    return false;
  }
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [isDark, setIsDark] = useState(() => resolveIsDark(getStoredPreference()));

  const hasLocalOverrideRef = useRef(false);
  const [themeColor, setThemeColorState] = useState<ThemeColor>('neutral');

  useEffect(() => {
    const myboteam = getMyBoTeam();
    myboteam
      .getTheme()
      .then((theme) => {
        if (hasLocalOverrideRef.current) return;
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          setPreference(theme);
          setIsDark(resolveIsDark(theme));
        }
      })
      .catch(() => {});

    if (myboteam.onThemeChange) {
      const cleanup = myboteam.onThemeChange(({ theme, resolved }) => {
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          setPreference(theme);
        }
        setIsDark(resolved === 'dark');
      });
      return cleanup;
    }
    return undefined;
  }, []);

  useEffect(() => {
    const myboteam = getMyBoTeam();
    myboteam
      .getThemeColor()
      .then((color) => {
        if (hasLocalOverrideRef.current) return;
        if (color && isValidColor(color)) {
          setThemeColorState(color);
        }
      })
      .catch(() => {});

    if (myboteam.onThemeColorChange) {
      const cleanup = myboteam.onThemeColorChange(({ themeColor: color }) => {
        if (isValidColor(color)) {
          setThemeColorState(color);
          applyColorTheme(color);
        }
      });
      return cleanup;
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (preference !== 'system') {
      return undefined;
    }
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      mq.addEventListener('change', handler);
      return () => {
        mq.removeEventListener('change', handler);
      };
    } catch {
      return undefined;
    }
  }, [preference]);

  const setTheme = (newPreference: ThemePreference) => {
    hasLocalOverrideRef.current = true;
    setPreference(newPreference);
    setIsDark(resolveIsDark(newPreference));
    applyLibTheme(newPreference);
    getMyBoTeam()
      .setTheme(newPreference)
      .catch(() => {});
  };

  const changeThemeColor = (color: ThemeColor) => {
    hasLocalOverrideRef.current = true;
    setThemeColorState(color);
    applyColorTheme(color);
    localStorage.setItem(COLOR_THEME_KEY, color);
    getMyBoTeam()
      .setThemeColor(color)
      .catch(() => {});
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return { theme: preference, isDark, toggleTheme, setTheme, themeColor, changeThemeColor };
}
