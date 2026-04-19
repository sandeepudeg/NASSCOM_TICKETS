import styled from '@emotion/styled';
import { Theme } from '@emotion/react';

import { tokens as baseTokens } from '../tokens/base';

// Define the theme interface
export interface DesignSystemTheme {
  tokens: typeof baseTokens;
  mode: 'light' | 'dark';
}

// Augment Emotion's theme
declare module '@emotion/react' {
  export interface Theme extends DesignSystemTheme {}
}

const tokens = baseTokens;

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