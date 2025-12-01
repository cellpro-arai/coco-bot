import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'theme';

function useTheme() {
  const [theme, setTheme] = useState<string>(
    typeof window !== 'undefined'
      ? localStorage.getItem(THEME_KEY) || 'light'
      : 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
}

export default useTheme;
