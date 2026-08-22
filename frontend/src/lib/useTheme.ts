import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const THEME_KEY = 'tmt_theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(t: Theme) {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
  }

  return { theme, setTheme };
}
