// TicketIQ Design System - Main Entry Point

// Export design tokens (will be available after build)
export * from './tokens';

// Export TypeScript types
export * from './types';

// Export theme utilities
export * from './theme';

// Export React integration
export * from './react';

// Animation and Loading Components
export { Spinner, Skeleton, ProgressBar, LoadingOverlay } from './components/Loading';
export { AnimatedButton, FloatingActionButton } from './components/AnimatedButton';
export { Modal, ConfirmModal } from './components/Modal';
export { Toast, ToastProvider, useToast } from './components/Toast';

// Accessible Components
export { 
  AccessibleButton, 
  AccessibleIconButton, 
  AccessibleToggleButton 
} from './components/AccessibleButton';
export { 
  AccessibleInput, 
  AccessibleSelect, 
  AccessibleTextarea, 
  AccessibleCheckbox, 
  AccessibleRadioGroup, 
  AccessibleForm 
} from './components/AccessibleForm';
export { 
  AccessibleSkipLink, 
  AccessibleNavItem, 
  AccessibleBreadcrumb, 
  AccessibleTabs, 
  AccessibleDropdown, 
  AccessiblePagination 
} from './components/AccessibleNavigation';

// Accessibility Utilities
export { 
  FocusManager, 
  KeyboardNavigation, 
  ScreenReaderAnnouncer, 
  ColorContrast, 
  MotionPreferences, 
  FormValidation, 
  TouchTargets, 
  AccessibilityTester 
} from './utils/accessibility';

// Performance Utilities
export { performanceOptimizer, PerformanceOptimizer } from './utils/performance';

// Version
export const VERSION = '1.0.0';