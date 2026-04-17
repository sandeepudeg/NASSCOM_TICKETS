import { useTheme } from '../ThemeProvider';

/**
 * Hook to access design tokens
 */
export function useDesignTokens() {
  const { tokens } = useTheme();
  return tokens;
}

export default useDesignTokens;