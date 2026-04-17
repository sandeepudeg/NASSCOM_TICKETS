# Tree-shaking Optimization

The TicketIQ Design System supports tree-shaking to minimize bundle size by eliminating unused components and styles.

## Import Strategies

### 1. Full Library Import
```typescript
import { AccessibleButton, Modal, AnimatedButton } from '@ticketiq/design-system';
```
**Bundle Impact:** Includes entire library (~50KB)

### 2. Category-based Imports (Recommended)
```typescript
import { AccessibleButton } from '@ticketiq/design-system/core';
import { Modal } from '@ticketiq/design-system/feedback';
import { AnimatedButton } from '@ticketiq/design-system/animation';
```
**Bundle Impact:** Only includes used categories (~15-20KB per category)

### 3. Modular Import
```typescript
import { AccessibleButton, Modal } from '@ticketiq/design-system/modular';
```
**Bundle Impact:** Tree-shaking enabled, only used components included

## Available Categories

- **core**: Essential components (buttons, forms, navigation)
- **animation**: Animated components and loading states
- **feedback**: Modals, toasts, and user feedback components
- **utilities**: Accessibility utilities and helper functions

## CSS Tree-shaking

### Critical CSS (Above-the-fold)
```html
<link rel="stylesheet" href="@ticketiq/design-system/css/critical">
```

### Non-critical CSS (Lazy loaded)
```html
<script src="@ticketiq/design-system/lazy-load.js"></script>
```

## Bundle Size Comparison

| Import Method | Bundle Size | Components Included |
|---------------|-------------|-------------------|
| Full import | ~50KB | All components |
| Core only | ~15KB | Essential components |
| Animation only | ~12KB | Loading & animations |
| Feedback only | ~10KB | Modals & toasts |
| Utilities only | ~8KB | Accessibility helpers |

## Webpack Configuration

```javascript
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};
```

## Rollup Configuration

```javascript
export default {
  external: ['@ticketiq/design-system'],
  output: {
    format: 'es' // Enable tree-shaking
  }
};
```
