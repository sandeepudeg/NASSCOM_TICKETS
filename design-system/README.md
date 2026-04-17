# TicketIQ Design System

A unified design system that establishes consistent visual language across React frontend, Flask admin, and future interfaces. Built with design tokens extracted from the demo page's sophisticated dark theme.

## Features

- **Design Tokens**: Hierarchical token system (global → semantic → component)
- **Multi-Format Output**: CSS custom properties, JavaScript modules, TypeScript definitions, JSON
- **Theme Support**: Dark and light theme variants with automatic switching
- **Framework Agnostic**: Works with React, Flask, and any web framework
- **Accessibility First**: WCAG 2.1 AA compliant by design
- **Performance Optimized**: Tree-shakable, minimal bundle impact

## Installation

```bash
npm install @ticketiq/design-system
```

## Usage

### CSS Custom Properties

```css
/* Import base styles */
@import '@ticketiq/design-system/dist/styles.css';

/* Use design tokens */
.my-component {
  background: var(--color-theme-background);
  color: var(--color-theme-text);
  padding: var(--spacing-4);
  border-radius: var(--borderRadius-md);
}
```

### JavaScript/TypeScript

```typescript
import { tokens, applyTheme, toggleTheme } from '@ticketiq/design-system';

// Access design tokens
const primaryColor = tokens.color.theme.primary;
const spacing = tokens.spacing[4];

// Theme management
applyTheme('dark'); // or 'light', 'auto'
toggleTheme(); // Switch between light/dark
```

### React Integration

```tsx
import { ThemeProvider } from '@ticketiq/design-system';

function App() {
  return (
    <ThemeProvider theme="dark">
      <YourApp />
    </ThemeProvider>
  );
}
```

## Design Tokens

### Color System

- **Primary**: `#4f46e5` (Indigo)
- **Accent**: `#06b6d4` (Cyan)
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)

### Typography Scale

- **Font Family**: Segoe UI, system-ui, sans-serif
- **Sizes**: 0.7rem to 3.5rem (xs to 9xl)
- **Weights**: 300 to 800 (light to extrabold)
- **Line Heights**: 1.15 (tight) to 1.75 (relaxed)

### Spacing Scale

Based on 4px grid system:
- **0-6**: 0 to 1rem (component spacing)
- **8-32**: 1.25rem to 5rem (layout spacing)

### Border Radius

- **sm**: 6px (inputs, small elements)
- **md**: 8px (buttons, cards)
- **lg**: 12px (large cards, modals)
- **xl**: 16px (hero sections)
- **full**: 999px (pills, badges)

## Theme Variants

### Dark Theme (Default)

Based on the demo page's sophisticated dark aesthetic:
- Background: `#0f0f1a` (deep dark blue)
- Surface: `#1a1a2e` (elevated dark)
- Text: `#e2e8f0` (light gray)
- Borders: `#2e2e4a` (subtle borders)

### Light Theme

Accessible light variant:
- Background: `#ffffff` (pure white)
- Surface: `#f8fafc` (light gray)
- Text: `#0f172a` (dark slate)
- Borders: `#e2e8f0` (light borders)

## Build System

The design system includes a comprehensive build pipeline with CDN distribution and version management:

### Available Scripts

```bash
# Full build (tokens + CSS + JS + CDN)
npm run build

# Development with watch mode
npm run dev

# Build individual parts
npm run build:tokens    # Generate design tokens
npm run build:css      # Process CSS with PostCSS + minification
npm run build:js       # Build JavaScript modules
npm run build:cdn      # Prepare CDN assets

# Version management
npm run version        # Patch version with changelog
npm run release        # Build, test, and publish (patch)
npm run release:minor  # Minor version release
npm run release:major  # Major version release
npm run changelog      # Update changelog only
```

### Build Outputs

The build system generates multiple formats for different use cases:

```
dist/
├── css/
│   ├── variables.css           # CSS custom properties
│   ├── dark-theme.css         # Dark theme tokens
│   └── light-theme.css        # Light theme tokens
├── js/
│   └── tokens.js              # ES6 module
├── ts/
│   └── tokens.d.ts            # TypeScript definitions
├── json/
│   └── tokens.json            # Raw token data
├── cdn/
│   ├── ticketiq-design-tokens.css
│   ├── ticketiq-design-tokens-dark.css
│   ├── ticketiq-design-tokens-light.css
│   ├── ticketiq-design-tokens.umd.js
│   ├── ticketiq-design-system.js
│   └── ticketiq-design-system.esm.js
├── styles.css                 # Complete stylesheet
├── styles.min.css             # Minified stylesheet (production)
├── index.js                   # Main CJS bundle
├── index.esm.js              # Main ESM bundle
└── build-info.json           # Build metadata
```

### CDN Usage

Quick integration without npm installation:

```html
<!-- CSS (minified for production) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/styles.min.css">

<!-- Design tokens only -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens.css">

<!-- JavaScript (UMD bundle) -->
<script src="https://cdn.jsdelivr.net/npm/@ticketiq/design-system@latest/dist/cdn/ticketiq-design-tokens.umd.js"></script>
<script>
  // Access tokens via global variable
  console.log(TicketIQDesignSystem.tokens.colors.primary);
</script>
```

See [CDN.md](./CDN.md) for detailed CDN usage instructions.

## Output Formats

- **CSS**: `dist/css/variables.css` - CSS custom properties
- **CSS Minified**: `dist/styles.min.css` - Production-ready minified styles
- **JavaScript**: `dist/js/tokens.js` - ES6 modules
- **TypeScript**: `dist/ts/tokens.d.ts` - Type definitions
- **JSON**: `dist/json/tokens.json` - Raw token data
- **CDN Assets**: `dist/cdn/` - Ready-to-use CDN files with UMD bundles

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0

- Initial release
- Design token system with hierarchical structure
- Dark and light theme variants
- Multi-format token generation (CSS, JS, TS, JSON)
- Theme switching utilities
- Base CSS styles and utility classes
- TypeScript support
- Accessibility compliance (WCAG 2.1 AA)