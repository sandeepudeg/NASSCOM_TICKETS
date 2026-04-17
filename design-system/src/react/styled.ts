import styled from '@emotion/styled';
import { Theme } from '@emotion/react';

// Import design tokens with fallback
let tokens: any = {};
try {
  // Try to import from build output
  const tokenModule = (typeof require !== 'undefined') ? require('../../dist/js/tokens') : {};
  tokens = tokenModule.tokens || tokenModule.default || {};
} catch (error) {
  // Fallback to default tokens structure
  tokens = {
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
}

// Define the theme interface for Emotion
export interface DesignSystemTheme {
  tokens: typeof tokens;
  mode: 'light' | 'dark';
}

// Create typed styled components
export const designSystemStyled = styled;

// Theme utilities for styled components
export const getToken = (path: string) => (props: { theme: DesignSystemTheme }) => {
  const keys = path.split('.');
  let value: any = props.theme.tokens;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Token path "${path}" not found in theme`);
      return undefined;
    }
  }
  
  return value;
};

// Common styled component utilities
export const spacing = {
  xs: getToken('spacing.xs'),
  sm: getToken('spacing.sm'),
  base: getToken('spacing.base'),
  lg: getToken('spacing.lg'),
  xl: getToken('spacing.xl'),
  xxl: getToken('spacing.xxl'),
};

export const colors = {
  primary: getToken('color.theme.primary'),
  secondary: getToken('color.theme.secondary'),
  success: getToken('color.theme.success'),
  warning: getToken('color.theme.warning'),
  danger: getToken('color.theme.danger'),
  info: getToken('color.theme.info'),
  text: getToken('color.theme.text'),
  textMuted: getToken('color.theme.textMuted'),
  background: getToken('color.theme.background'),
  background2: getToken('color.theme.background2'),
  background3: getToken('color.theme.background3'),
  surface: getToken('color.theme.surface'),
  border: getToken('color.theme.border'),
};

export const typography = {
  fontFamily: {
    sans: getToken('typography.fontFamily.sans'),
    mono: getToken('typography.fontFamily.mono'),
  },
  fontSize: {
    xs: getToken('typography.fontSize.xs'),
    sm: getToken('typography.fontSize.sm'),
    base: getToken('typography.fontSize.base'),
    lg: getToken('typography.fontSize.lg'),
    xl: getToken('typography.fontSize.xl'),
    h1: getToken('typography.fontSize.h1'),
    h2: getToken('typography.fontSize.h2'),
    h3: getToken('typography.fontSize.h3'),
    h4: getToken('typography.fontSize.h4'),
    h5: getToken('typography.fontSize.h5'),
    h6: getToken('typography.fontSize.h6'),
  },
  fontWeight: {
    light: getToken('typography.fontWeight.light'),
    normal: getToken('typography.fontWeight.normal'),
    medium: getToken('typography.fontWeight.medium'),
    semibold: getToken('typography.fontWeight.semibold'),
    bold: getToken('typography.fontWeight.bold'),
  },
  lineHeight: {
    tight: getToken('typography.lineHeight.tight'),
    base: getToken('typography.lineHeight.base'),
    relaxed: getToken('typography.lineHeight.relaxed'),
  },
};

export const borderRadius = {
  none: getToken('borderRadius.none'),
  sm: getToken('borderRadius.sm'),
  base: getToken('borderRadius.base'),
  lg: getToken('borderRadius.lg'),
  xl: getToken('borderRadius.xl'),
  full: getToken('borderRadius.full'),
};

export const shadows = {
  none: getToken('shadow.none'),
  small: getToken('shadow.small'),
  medium: getToken('shadow.medium'),
  large: getToken('shadow.large'),
};

// Responsive breakpoint utilities
export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px',
};

export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  xxl: `@media (min-width: ${breakpoints.xxl})`,
};

// Animation utilities
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '400ms ease-in-out',
};

// Helper functions for common patterns
export const focusRing = (props: { theme: DesignSystemTheme }) => `
  outline: 2px solid ${colors.primary(props)};
  outline-offset: 2px;
`;

export const visuallyHidden = `
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// CSS-in-JS theme provider utilities
export const createTheme = (mode: 'light' | 'dark'): DesignSystemTheme => ({
  tokens,
  mode,
});

export default designSystemStyled;