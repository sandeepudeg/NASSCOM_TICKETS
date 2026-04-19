// Theme utilities for TicketIQ Design System

import { ThemeMode, ThemeConfig } from '../types';

export type { ThemeMode, ThemeConfig };

export interface ThemeChangeEvent {
  theme: ThemeMode;
  previousTheme: ThemeMode;
  source: 'user' | 'system' | 'storage';
}

// Default configuration
const DEFAULT_CONFIG: Required<ThemeConfig> = {
  mode: 'dark',
  tokens: {},
  autoDetect: true,
  persistPreference: true,
  storageKey: 'ticketiq-theme-preference'
};

let currentConfig: Required<ThemeConfig> = { ...DEFAULT_CONFIG };
let systemThemeWatcher: (() => void) | null = null;
let themeChangeListeners: ((event: ThemeChangeEvent) => void)[] = [];

/**
 * Load theme preference from localStorage
 */
function loadStoredTheme(): ThemeMode | null {
  if (!currentConfig.persistPreference || typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(currentConfig.storageKey);
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.warn('Failed to load theme preference from localStorage:', error);
  }
  
  return null;
}

/**
 * Save theme preference to localStorage
 */
function saveThemePreference(theme: ThemeMode): void {
  if (!currentConfig.persistPreference || typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(currentConfig.storageKey, theme);
  } catch (error) {
    console.warn('Failed to save theme preference to localStorage:', error);
  }
}

/**
 * Detect system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the actual theme to apply (handles 'auto' mode)
 */
function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    return getSystemTheme();
  }
  return mode as 'light' | 'dark';
}

/**
 * Apply theme to document root
 */
export function applyTheme(mode: ThemeMode = 'dark', source: 'user' | 'system' | 'storage' = 'user'): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  const root = document.documentElement;
  const previousTheme = getCurrentTheme();
  const resolvedTheme = resolveTheme(mode);
  
  // Remove existing theme classes
  root.classList.remove('theme-light', 'theme-dark');
  
  // Apply new theme class
  root.classList.add(`theme-${resolvedTheme}`);
  root.setAttribute('data-theme', resolvedTheme);
  root.setAttribute('data-theme-mode', mode); // Store original mode (including 'auto')
  
  // Save preference if it's a user action
  if (source === 'user') {
    saveThemePreference(mode);
  }
  
  // Notify listeners
  const event: ThemeChangeEvent = {
    theme: resolvedTheme,
    previousTheme,
    source
  };
  
  themeChangeListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Theme change listener error:', error);
    }
  });
}

/**
 * Get current theme mode
 */
export function getCurrentTheme(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'dark';
  }
  
  const root = document.documentElement;
  const dataTheme = root.getAttribute('data-theme') as 'light' | 'dark';
  return dataTheme || 'dark';
}

/**
 * Get current theme mode (including 'auto')
 */
export function getCurrentThemeMode(): ThemeMode {
  if (typeof document === 'undefined') {
    return 'dark';
  }
  
  const root = document.documentElement;
  const dataThemeMode = root.getAttribute('data-theme-mode') as ThemeMode;
  return dataThemeMode || getCurrentTheme();
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): ThemeMode {
  const current = getCurrentTheme();
  const newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme, 'user');
  return newTheme;
}

/**
 * Set theme to auto (follow system preference)
 */
export function setAutoTheme(): void {
  applyTheme('auto', 'user');
}

/**
 * Check if current theme is auto mode
 */
export function isAutoTheme(): boolean {
  return getCurrentThemeMode() === 'auto';
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback?: (theme: ThemeMode) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    const currentMode = getCurrentThemeMode();
    if (currentMode === 'auto') {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme('auto', 'system'); // This will resolve to the new system theme
      callback?.(newTheme);
    }
  };
  
  mediaQuery.addEventListener('change', handler);
  
  // Return cleanup function
  return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Add theme change listener
 */
export function addThemeChangeListener(listener: (event: ThemeChangeEvent) => void): () => void {
  themeChangeListeners.push(listener);
  
  // Return cleanup function
  return () => {
    const index = themeChangeListeners.indexOf(listener);
    if (index > -1) {
      themeChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Initialize theme system
 */
export function initializeTheme(config: Partial<ThemeConfig> = {}): void {
  // Merge with default configuration
  currentConfig = { ...DEFAULT_CONFIG, ...config };
  
  let initialTheme: ThemeMode = currentConfig.mode;
  
  // Try to load stored preference first
  if (currentConfig.persistPreference) {
    const storedTheme = loadStoredTheme();
    if (storedTheme) {
      initialTheme = storedTheme;
    }
  }
  
  // Apply initial theme
  applyTheme(initialTheme, 'storage');
  
  // Set up system theme watcher
  if (systemThemeWatcher) {
    systemThemeWatcher(); // Clean up existing watcher
  }
  
  systemThemeWatcher = watchSystemTheme();
}

/**
 * Cleanup theme system
 */
export function cleanupTheme(): void {
  if (systemThemeWatcher) {
    systemThemeWatcher();
    systemThemeWatcher = null;
  }
  
  themeChangeListeners.length = 0;
}

// CSS custom property utilities
export function setCSSVariable(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(`--${name}`, value);
}

export function getCSSVariable(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

export function removeCSSVariable(name: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.removeProperty(`--${name}`);
}

/**
 * Get all theme-related CSS variables
 */
export function getThemeVariables(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  
  const styles = getComputedStyle(document.documentElement);
  const themeVars: Record<string, string> = {};
  
  // Get all CSS custom properties that start with --color-theme-
  for (let i = 0; i < styles.length; i++) {
    const property = styles[i];
    if (property.startsWith('--color-theme-')) {
      themeVars[property] = styles.getPropertyValue(property).trim();
    }
  }
  
  return themeVars;
}

/**
 * Validate WCAG contrast ratio
 */
export function validateContrast(foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} {
  // This is a simplified contrast calculation
  // In a real implementation, you'd want to use a proper color library
  const getLuminance = (color: string): number => {
    // Remove # if present
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  };
}