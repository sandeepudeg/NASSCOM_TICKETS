import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DesignSystemThemeProvider, useTheme } from '../ThemeProvider';

// Test component that uses the theme
const TestComponent = () => {
  const { currentTheme, tokens } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{currentTheme}</span>
      <span data-testid="primary-color">{tokens.color?.theme?.primary || 'fallback'}</span>
    </div>
  );
};

describe('DesignSystemThemeProvider', () => {
  it('provides theme context to children', () => {
    render(
      <DesignSystemThemeProvider theme="dark">
        <TestComponent />
      </DesignSystemThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#4f46e5');
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a DesignSystemThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('supports light theme', () => {
    render(
      <DesignSystemThemeProvider theme="light">
        <TestComponent />
      </DesignSystemThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });
});