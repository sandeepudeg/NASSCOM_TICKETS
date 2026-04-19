// Design System TypeScript Definitions

import { tokens } from '../tokens/base';

// Token types
export type Tokens = typeof tokens;

export type ColorTokens = typeof tokens.color;
export type TypographyTokens = typeof tokens.typography;
export type SpacingTokens = typeof tokens.spacing;
export type BorderRadiusTokens = typeof tokens.borderRadius;
export type ShadowTokens = typeof tokens.shadow;

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: ThemeMode;
  tokens?: Partial<Tokens>;
  autoDetect?: boolean;
  persistPreference?: boolean;
  storageKey?: string;
}

// Component size types
export type ComponentSize = 'small' | 'medium' | 'large';

// Component variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type InputVariant = 'default' | 'filled' | 'borderless';
export type CardVariant = 'default' | 'outlined' | 'filled' | 'elevated';
export type ModalVariant = 'default' | 'centered' | 'drawer';
export type NavigationVariant = 'horizontal' | 'vertical' | 'inline' | 'sidebar';
export type AlertVariant = 'filled' | 'outlined' | 'subtle';
export type BadgeVariant = 'filled' | 'outlined' | 'dot' | 'subtle';
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton';

// Container and layout types
export type ContainerSize = 'small' | 'medium' | 'large' | 'full';
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type FlexJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

// Spacing types
export type SpacingSize = 'none' | 'small' | 'medium' | 'large' | 'xlarge';
export type PaddingSize = 'none' | 'small' | 'medium' | 'large';

// Color scheme types
export type ColorScheme = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

// Toast and notification types
export type ToastType = 'success' | 'info' | 'warning' | 'error';
export type ToastPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'top' | 'bottom';

// Status types
export type StatusType = 'online' | 'offline' | 'busy' | 'away' | 'success' | 'warning' | 'error' | 'info';

// Responsive breakpoint types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// CSS-in-JS types
export interface StyledProps {
  theme: {
    tokens: Tokens;
    mode: 'light' | 'dark';
  };
}

// Component base props
export interface ComponentBaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Accessibility props
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Event handler types
export type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
export type ChangeHandler<T = any> = (value: T, event?: React.ChangeEvent<HTMLInputElement>) => void;
export type FocusHandler = (event: React.FocusEvent<HTMLElement>) => void;
export type BlurHandler = (event: React.FocusEvent<HTMLElement>) => void;

// Form types
export interface FormFieldProps extends ComponentBaseProps, AccessibilityProps {
  name?: string;
  value?: any;
  defaultValue?: any;
  onChange?: ChangeHandler;
  onFocus?: FocusHandler;
  onBlur?: BlurHandler;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string;
  success?: boolean;
  placeholder?: string;
}

// Layout types
export interface DesignSystemLayoutProps extends ComponentBaseProps {
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  fullHeight?: boolean;
}

// Animation types
export type TransitionDuration = 'fast' | 'normal' | 'slow';
export type EasingFunction = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Re-export commonly used React types
export type {
  ReactNode,
  ReactElement,
  ComponentType,
  ComponentProps,
  RefObject,
  ForwardedRef,
  CSSProperties,
  MouseEvent,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
} from 'react';