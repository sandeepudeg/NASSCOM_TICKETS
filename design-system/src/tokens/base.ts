// Design System Base Tokens - Source of Truth
// These tokens are used during compilation to avoid circular dependencies with build artifacts.

export const tokens = {
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
      sans: 'Segoe UI, system-ui, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      h1: '32px',
      h2: '28px',
      h3: '24px',
      h4: '20px',
      h5: '18px',
      h6: '16px'
    },
    fontWeight: {
      light: '300',
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
    none: '0',
    xs: '4px',
    sm: '8px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  shadow: {
    none: 'none',
    small: '0 1px 3px rgba(0, 0, 0, 0.12)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  }
};

export default tokens;
