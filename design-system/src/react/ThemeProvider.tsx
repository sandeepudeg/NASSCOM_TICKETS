import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ThemeConfig as AntdThemeConfig } from 'antd/es/config-provider/context';
import { 
  ThemeMode, 
  ThemeConfig, 
  initializeTheme, 
  applyTheme, 
  getCurrentThemeMode,
  addThemeChangeListener,
  ThemeChangeEvent 
} from '../theme';

// Import design tokens with fallback (works in ESM builds where `require` is undefined)
const fallbackTokens = {
  color: {
    theme: {
      primary: '#4f46e5',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
      text: '#ffffff',
      textMuted: '#9ca3af',
      background: '#111827',
      background2: '#1f2937',
      background3: '#374151',
      surface: '#1f2937',
      border: '#374151',
    }
  },
  typography: {
    fontFamily: {
      sans: 'Segoe UI, system-ui, sans-serif'
    },
    fontSize: {
      base: '16px',
      h1: '32px',
      h2: '28px',
      h3: '24px',
      h4: '20px',
      h5: '18px'
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeight: {
      tight: '1.25',
      base: '1.5',
      relaxed: '1.75'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  shadow: {
    small: '0 1px 3px rgba(0, 0, 0, 0.12)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  }
};

let tokens: any = fallbackTokens;
try {
  // Try to import from build output (CommonJS path)
  const tokenModule = (typeof require !== 'undefined') ? require('../../dist/js/tokens') : {};
  const candidate = tokenModule.tokens || tokenModule.default || {};

  // Only overwrite when the expected shape is present
  if (candidate?.color?.theme) {
    tokens = candidate;
  }
} catch (error) {
  tokens = fallbackTokens;
}

export interface DesignSystemThemeProviderProps {
  children: ReactNode;
  theme?: ThemeMode;
  config?: Partial<ThemeConfig>;
  antdConfig?: Partial<AntdThemeConfig>;
}

interface ThemeContextValue {
  currentTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  tokens: typeof tokens;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a DesignSystemThemeProvider');
  }
  return context;
}

/**
 * Generate Ant Design theme configuration from design tokens
 */
function generateAntdTheme(themeMode: ThemeMode): AntdThemeConfig {
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && getCurrentThemeMode() === 'dark');
  
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      // Color tokens
      colorPrimary: tokens.color.theme.primary,
      colorSuccess: tokens.color.theme.success,
      colorWarning: tokens.color.theme.warning,
      colorError: tokens.color.theme.danger,
      colorInfo: tokens.color.theme.info,
      
      // Background colors
      colorBgContainer: tokens.color.theme.background,
      colorBgElevated: tokens.color.theme.surface,
      colorBgLayout: tokens.color.theme.background2,
      
      // Text colors
      colorText: tokens.color.theme.text,
      colorTextHeading: tokens.color.theme.text,
      colorTextDescription: tokens.color.theme.textMuted,
      colorTextSecondary: tokens.color.theme.textMuted,
      colorTextTertiary: tokens.color.theme.textMuted,
      colorTextQuaternary: tokens.color.theme.textMuted,
      
      // Border colors
      colorBorder: tokens.color.theme.border,
      colorBorderSecondary: tokens.color.theme.border,
      
      // Typography
      fontFamily: tokens.typography.fontFamily.sans,
      fontSize: parseInt(tokens.typography.fontSize.base),
      fontSizeHeading1: parseInt(tokens.typography.fontSize.h1),
      fontSizeHeading2: parseInt(tokens.typography.fontSize.h2),
      fontSizeHeading3: parseInt(tokens.typography.fontSize.h3),
      fontSizeHeading4: parseInt(tokens.typography.fontSize.h4),
      fontSizeHeading5: parseInt(tokens.typography.fontSize.h5),
      
      // Spacing
      padding: parseInt(tokens.spacing.base),
      paddingXS: parseInt(tokens.spacing.xs),
      paddingSM: parseInt(tokens.spacing.sm),
      paddingLG: parseInt(tokens.spacing.lg),
      paddingXL: parseInt(tokens.spacing.xl),
      
      margin: parseInt(tokens.spacing.base),
      marginXS: parseInt(tokens.spacing.xs),
      marginSM: parseInt(tokens.spacing.sm),
      marginLG: parseInt(tokens.spacing.lg),
      marginXL: parseInt(tokens.spacing.xl),
      
      // Border radius
      borderRadius: parseInt(tokens.borderRadius.base),
      borderRadiusXS: parseInt(tokens.borderRadius.sm),
      borderRadiusSM: parseInt(tokens.borderRadius.sm),
      borderRadiusLG: parseInt(tokens.borderRadius.lg),
      
      // Shadows
      boxShadow: tokens.shadow.medium,
      boxShadowSecondary: tokens.shadow.small,
      boxShadowTertiary: tokens.shadow.large,
      
      // Line height
      lineHeight: parseFloat(tokens.typography.lineHeight.base),
      lineHeightHeading1: parseFloat(tokens.typography.lineHeight.tight),
      lineHeightHeading2: parseFloat(tokens.typography.lineHeight.tight),
      lineHeightHeading3: parseFloat(tokens.typography.lineHeight.tight),
      lineHeightHeading4: parseFloat(tokens.typography.lineHeight.tight),
      lineHeightHeading5: parseFloat(tokens.typography.lineHeight.tight),
    },
    components: {
      Button: {
        borderRadius: parseInt(tokens.borderRadius.base),
        controlHeight: 40,
        fontSize: parseInt(tokens.typography.fontSize.base),
        fontWeight: parseInt(tokens.typography.fontWeight.medium),
      },
      Input: {
        borderRadius: parseInt(tokens.borderRadius.base),
        controlHeight: 40,
        fontSize: parseInt(tokens.typography.fontSize.base),
      },
      Card: {
        borderRadius: parseInt(tokens.borderRadius.lg),
        boxShadow: tokens.shadow.medium,
      },
      Modal: {
        borderRadius: parseInt(tokens.borderRadius.lg),
      },
      Menu: {
        borderRadius: parseInt(tokens.borderRadius.base),
      },
      Table: {
        borderRadius: parseInt(tokens.borderRadius.base),
      },
      Tabs: {
        borderRadius: parseInt(tokens.borderRadius.base),
      },
    }
  };
}

/**
 * Design System Theme Provider
 * Wraps Ant Design ConfigProvider and manages theme state
 */
export function DesignSystemThemeProvider({
  children,
  theme: initialTheme = 'dark',
  config = {},
  antdConfig = {}
}: DesignSystemThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(initialTheme);
  const [antdThemeConfig, setAntdThemeConfig] = useState<AntdThemeConfig>(() => 
    generateAntdTheme(initialTheme)
  );

  // Initialize theme system on mount
  useEffect(() => {
    initializeTheme({
      mode: initialTheme,
      ...config
    });
    
    // Set up theme change listener
    const cleanup = addThemeChangeListener((event: ThemeChangeEvent) => {
      setCurrentTheme(event.theme);
      setAntdThemeConfig(generateAntdTheme(event.theme));
    });
    
    return cleanup;
  }, [initialTheme, config]);

  const setTheme = (theme: ThemeMode) => {
    applyTheme(theme, 'user');
    setCurrentTheme(theme);
    setAntdThemeConfig(generateAntdTheme(theme));
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const contextValue: ThemeContextValue = {
    currentTheme,
    setTheme,
    toggleTheme,
    tokens
  };

  // Merge Ant Design theme configurations
  const finalAntdConfig: AntdThemeConfig = {
    ...antdThemeConfig,
    ...antdConfig,
    token: {
      ...antdThemeConfig.token,
      ...antdConfig.token
    },
    components: {
      ...antdThemeConfig.components,
      ...antdConfig.components
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={finalAntdConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export default DesignSystemThemeProvider;
