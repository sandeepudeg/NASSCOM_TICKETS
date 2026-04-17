# TicketIQ Design System - Theme System

## Overview

The TicketIQ Design System theme system provides comprehensive dark/light theme support with automatic detection, WCAG AA compliance, and smooth transitions. The system is built on CSS custom properties and provides both programmatic and declarative APIs for theme management.

## Features

✅ **Dark/Light Theme Variants**: Complete theme implementations with proper contrast ratios  
✅ **WCAG AA Compliance**: All color combinations meet accessibility standards  
✅ **Automatic Detection**: Respects system preferences with `prefers-color-scheme`  
✅ **Theme Persistence**: Saves user preferences to localStorage  
✅ **Smooth Transitions**: Animated theme switching with reduced motion support  
✅ **TypeScript Support**: Full type definitions for all theme utilities  
✅ **CDN Ready**: Distributed via CDN for easy integration  

## Quick Start

### 1. Basic HTML Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="https://cdn.ticketiq.com/design-system/ticketiq-design-system.css">
</head>
<body>
    <script type="module">
        import { initializeTheme } from 'https://cdn.ticketiq.com/design-system/ticketiq-design-system.esm.js';
        
        // Initialize with auto theme detection
        initializeTheme({ mode: 'auto' });
    </script>
</body>
</html>
```

### 2. React Integration

```tsx
import { initializeTheme, applyTheme, addThemeChangeListener } from '@ticketiq/design-system';
import '@ticketiq/design-system/dist/styles.css';

function App() {
    useEffect(() => {
        // Initialize theme system
        initializeTheme({
            mode: 'auto',
            persistPreference: true
        });
        
        // Listen for theme changes
        const cleanup = addThemeChangeListener((event) => {
            console.log('Theme changed to:', event.theme);
        });
        
        return cleanup;
    }, []);
    
    return (
        <div className="app">
            <button onClick={() => applyTheme('light')}>Light Theme</button>
            <button onClick={() => applyTheme('dark')}>Dark Theme</button>
        </div>
    );
}
```

### 3. Flask Integration

```html
<!-- In your Flask template -->
<link rel="stylesheet" href="{{ url_for('static', filename='css/ticketiq-design-system.css') }}">

<script>
    // Initialize theme system
    document.addEventListener('DOMContentLoaded', function() {
        if (window.TicketIQDesignSystem) {
            window.TicketIQDesignSystem.initializeTheme({ mode: 'auto' });
        }
    });
</script>
```

## API Reference

### Theme Utilities

#### `initializeTheme(config?: ThemeConfig)`

Initializes the theme system with optional configuration.

```typescript
interface ThemeConfig {
    mode?: 'light' | 'dark' | 'auto';
    autoDetect?: boolean;
    persistPreference?: boolean;
    storageKey?: string;
}

// Examples
initializeTheme(); // Uses defaults (dark theme)
initializeTheme({ mode: 'auto' }); // Auto-detect system preference
initializeTheme({ mode: 'light', persistPreference: false }); // Light theme, no persistence
```

#### `applyTheme(mode: ThemeMode, source?: 'user' | 'system' | 'storage')`

Applies a specific theme.

```typescript
applyTheme('dark'); // Apply dark theme
applyTheme('light', 'user'); // Apply light theme (user action)
applyTheme('auto'); // Follow system preference
```

#### `getCurrentTheme(): ThemeMode`

Gets the currently active theme.

```typescript
const theme = getCurrentTheme(); // 'light' | 'dark'
```

#### `getCurrentThemeMode(): ThemeMode`

Gets the current theme mode (including 'auto').

```typescript
const mode = getCurrentThemeMode(); // 'light' | 'dark' | 'auto'
```

#### `toggleTheme(): ThemeMode`

Toggles between light and dark themes.

```typescript
const newTheme = toggleTheme(); // Returns new theme
```

#### `addThemeChangeListener(callback: (event: ThemeChangeEvent) => void)`

Listens for theme changes.

```typescript
const cleanup = addThemeChangeListener((event) => {
    console.log('Theme changed:', event.theme);
    console.log('Previous theme:', event.previousTheme);
    console.log('Change source:', event.source);
});

// Clean up listener
cleanup();
```

### CSS Custom Properties

The theme system provides comprehensive CSS custom properties for consistent theming:

#### Color Tokens

```css
/* Primary colors */
--color-theme-primary: #4f46e5;
--color-theme-primary-hover: #3730a3;
--color-theme-accent: #06b6d4;

/* Text colors */
--color-theme-text: #e2e8f0; /* Dark theme */
--color-theme-text: #0f172a; /* Light theme */
--color-theme-text-muted: #94a3b8; /* Dark theme */
--color-theme-text-muted: #475569; /* Light theme */

/* Background colors */
--color-theme-background: #0f0f1a; /* Dark theme */
--color-theme-background: #ffffff; /* Light theme */
--color-theme-background-secondary: #16162a; /* Dark theme */
--color-theme-background-secondary: #f8fafc; /* Light theme */

/* Surface and border colors */
--color-theme-surface: #1a1a2e; /* Dark theme */
--color-theme-surface: #ffffff; /* Light theme */
--color-theme-border: #2e2e4a; /* Dark theme */
--color-theme-border: #e2e8f0; /* Light theme */

/* Status colors */
--color-theme-success: #10b981;
--color-theme-warning: #f59e0b;
--color-theme-danger: #ef4444;
```

#### Component Tokens

```css
/* Badge colors (theme-aware) */
--component-badge-green-background: rgba(16, 185, 129, 0.15); /* Dark */
--component-badge-green-background: rgba(16, 185, 129, 0.1);  /* Light */
--component-badge-green-color: #6ee7b7; /* Dark */
--component-badge-green-color: #059669; /* Light */

/* Similar patterns for amber, red, blue, cyan badges */
```

### Theme Classes

The system provides utility classes for theme-aware styling:

```css
.theme-surface { background-color: var(--color-theme-surface); }
.theme-text { color: var(--color-theme-text); }
.theme-text-muted { color: var(--color-theme-text-muted); }
.theme-background { background-color: var(--color-theme-background); }
.theme-border { border-color: var(--color-theme-border); }
```

## Theme Toggle Component

### HTML Implementation

```html
<div id="theme-toggle"></div>

<script type="module">
    import { ThemeToggle } from '@ticketiq/design-system';
    
    new ThemeToggle({
        container: document.getElementById('theme-toggle'),
        showAutoOption: true,
        showLabels: true
    });
</script>
```

### React Implementation

```tsx
import { useState, useEffect } from 'react';
import { getCurrentThemeMode, applyTheme, setAutoTheme, addThemeChangeListener } from '@ticketiq/design-system';

function ThemeToggle() {
    const [currentMode, setCurrentMode] = useState(getCurrentThemeMode());
    
    useEffect(() => {
        const cleanup = addThemeChangeListener(() => {
            setCurrentMode(getCurrentThemeMode());
        });
        return cleanup;
    }, []);
    
    return (
        <div className="theme-toggle-group">
            <button 
                className={`theme-toggle-button ${currentMode === 'light' ? 'active' : ''}`}
                onClick={() => applyTheme('light')}
            >
                ☀️ Light
            </button>
            <button 
                className={`theme-toggle-button ${currentMode === 'dark' ? 'active' : ''}`}
                onClick={() => applyTheme('dark')}
            >
                🌙 Dark
            </button>
            <button 
                className={`theme-toggle-button ${currentMode === 'auto' ? 'active' : ''}`}
                onClick={() => setAutoTheme()}
            >
                🔄 Auto
            </button>
        </div>
    );
}
```

## WCAG Compliance

All theme combinations meet WCAG 2.1 AA standards:

### Dark Theme Contrast Ratios
- Text on Background: **15.44:1** ✅
- Muted Text on Background: **7.42:1** ✅  
- Text on Surface: **13.84:1** ✅
- White on Primary: **6.29:1** ✅

### Light Theme Contrast Ratios
- Text on Background: **17.85:1** ✅
- Muted Text on Background: **7.58:1** ✅
- Text on Surface: **17.85:1** ✅  
- White on Primary: **6.29:1** ✅

## Advanced Features

### Custom Theme Creation

```typescript
// Create custom theme tokens
const customTokens = {
    '--color-theme-primary': '#ff6b6b',
    '--color-theme-accent': '#4ecdc4'
};

// Apply custom tokens
Object.entries(customTokens).forEach(([property, value]) => {
    setCSSVariable(property.replace('--', ''), value);
});
```

### System Integration

```typescript
// Watch for system theme changes
const cleanup = watchSystemTheme((newTheme) => {
    console.log('System theme changed to:', newTheme);
    // Custom logic here
});

// Cleanup when component unmounts
cleanup();
```

### Accessibility Features

```css
/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --color-theme-border: currentColor;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    * {
        transition-duration: 0.01ms !important;
    }
}

/* Print styles (force light theme) */
@media print {
    :root {
        --color-theme-text: #000000 !important;
        --color-theme-background: #ffffff !important;
    }
}
```

## File Structure

```
design-system/
├── src/
│   ├── theme/
│   │   └── index.ts              # Theme utilities
│   ├── styles/
│   │   ├── themes.css            # Theme CSS classes
│   │   └── index.css             # Main stylesheet
│   └── components/
│       └── ThemeToggle.ts        # Theme toggle component
├── dist/
│   ├── css/
│   │   ├── variables.css         # Base tokens
│   │   ├── dark-theme.css        # Dark theme tokens
│   │   └── light-theme.css       # Light theme tokens
│   ├── cdn/
│   │   ├── ticketiq-design-tokens-dark.css
│   │   └── ticketiq-design-tokens-light.css
│   └── js/
│       └── tokens.js             # JavaScript tokens
└── tests/
    └── theme-validation.js       # Validation tests
```

## Browser Support

- **Modern Browsers**: Full support (Chrome 49+, Firefox 31+, Safari 9.1+)
- **CSS Custom Properties**: Required for theme switching
- **localStorage**: Used for preference persistence (graceful degradation)
- **matchMedia**: Used for system preference detection (graceful degradation)

## Performance

- **CSS Bundle Size**: ~10KB per theme (minified)
- **JavaScript Bundle Size**: ~8KB (minified)
- **Runtime Performance**: 60fps theme transitions
- **Memory Usage**: Minimal (event listeners cleaned up automatically)

## Migration Guide

### From Existing Dark Theme

1. Replace hardcoded colors with CSS custom properties
2. Import the design system stylesheet
3. Initialize the theme system
4. Add theme toggle components

### Example Migration

```css
/* Before */
.my-component {
    background: #1a1a2e;
    color: #e2e8f0;
    border: 1px solid #2e2e4a;
}

/* After */
.my-component {
    background: var(--color-theme-surface);
    color: var(--color-theme-text);
    border: 1px solid var(--color-theme-border);
}
```

## Troubleshooting

### Theme Not Switching

1. Ensure CSS custom properties are supported
2. Check that the theme system is initialized
3. Verify CSS imports are correct

### Contrast Issues

1. Use the validation script: `node tests/theme-validation.js`
2. Check color combinations with browser dev tools
3. Test with screen readers and high contrast mode

### Performance Issues

1. Enable reduced motion for users who prefer it
2. Use `will-change: transform` sparingly
3. Avoid animating layout properties

## Contributing

When adding new theme tokens:

1. Add to both `dark.json` and `light.json`
2. Ensure WCAG AA compliance (4.5:1 contrast ratio minimum)
3. Update TypeScript definitions
4. Add validation tests
5. Update documentation

## License

MIT License - see LICENSE file for details.