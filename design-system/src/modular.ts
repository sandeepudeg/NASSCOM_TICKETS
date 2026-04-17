// TicketIQ Design System - Modular Exports for Tree-shaking

// Core exports (always included)
export * from './tokens';
export * from './types';
export * from './theme';

// Category-based exports for tree-shaking
export * from './categories/core';
export * from './categories/animation';
export * from './categories/feedback';
export * from './categories/utilities';

// Version
export const VERSION = '1.0.0';
