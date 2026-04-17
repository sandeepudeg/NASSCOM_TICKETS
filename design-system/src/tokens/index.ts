// Design tokens export
// This will be populated by the build process

// Placeholder for build-time token injection
declare const tokens: any;

// Export tokens if available, otherwise export empty object
export const designTokens = typeof tokens !== 'undefined' ? tokens : {};

// Default export
export default designTokens;

// Named export for compatibility
export { designTokens as tokens };