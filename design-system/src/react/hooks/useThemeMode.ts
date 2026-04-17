import { useTheme } from '../ThemeProvider';
import { ThemeMode } from '../../theme';

/**
 * Hook to manage theme mode
 */
export function useThemeMode() {
  const { currentTheme, setTheme, toggleTheme } = useTheme();

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');
  const setAutoTheme = () => setTheme('auto');

  const isLight = currentTheme === 'light';
  const isDark = currentTheme === 'dark';
  const isAuto = currentTheme === 'auto';

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    isLight,
    isDark,
    isAuto
  };
}

export default useThemeMode;