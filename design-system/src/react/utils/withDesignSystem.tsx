import React, { ComponentType } from 'react';
import { ThemeProvider } from '@emotion/react';
import { DesignSystemThemeProvider, DesignSystemThemeProviderProps } from '../ThemeProvider';
import { createTheme } from '../styled';

/**
 * Higher-order component that wraps a component with the design system theme provider
 */
export function withDesignSystem<P extends object>(
  Component: ComponentType<P>,
  themeConfig?: Partial<DesignSystemThemeProviderProps>
) {
  const WrappedComponent = (props: P) => {
    return (
      <DesignSystemThemeProvider {...themeConfig}>
        <ThemeProvider theme={createTheme((themeConfig?.theme === 'auto' ? 'dark' : themeConfig?.theme) as any || 'dark')}>
          <Component {...props} />
        </ThemeProvider>
      </DesignSystemThemeProvider>
    );
  };

  WrappedComponent.displayName = `withDesignSystem(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default withDesignSystem;