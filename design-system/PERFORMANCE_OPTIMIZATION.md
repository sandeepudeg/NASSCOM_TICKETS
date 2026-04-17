# Performance Optimization Guide

The TicketIQ Design System includes comprehensive performance optimizations to ensure fast loading times and excellent user experience.

## Overview

Our performance optimization strategy includes:

- **Tree-shaking**: Eliminate unused components and styles
- **Critical CSS extraction**: Load above-the-fold styles first
- **Font optimization**: Prevent layout shift during font loading
- **Lazy loading**: Load non-critical assets on demand
- **Layout shift prevention**: Maintain stable layouts during loading

## Implementation

### 1. Tree-shaking for Unused Components

#### Modular Imports (Recommended)
```typescript
// Instead of importing everything
import { Button, Modal, Toast } from '@ticketiq/design-system';

// Import only what you need by category
import { AccessibleButton } from '@ticketiq/design-system/core';
import { Modal } from '@ticketiq/design-system/feedback';
import { AnimatedButton } from '@ticketiq/design-system/animation';
```

#### Bundle Size Comparison
| Import Method | Bundle Size | Reduction |
|---------------|-------------|-----------|
| Full import | ~50KB | - |
| Core only | ~15KB | 70% |
| Animation only | ~12KB | 76% |
| Feedback only | ~10KB | 80% |
| Utilities only | ~8KB | 84% |

### 2. Critical CSS Extraction

#### Above-the-fold CSS
```html
<!-- Critical CSS (inline for fastest loading) -->
<style>
  /* Critical styles loaded inline */
</style>

<!-- Or link to critical CSS file -->
<link rel="stylesheet" href="@ticketiq/design-system/css/critical">
```

#### Non-critical CSS (Lazy loaded)
```html
<!-- Lazy load non-critical styles -->
<script src="@ticketiq/design-system/lazy-load.js"></script>
```

### 3. Font Loading Optimization

#### Prevent Layout Shift
```html
<!-- Include font optimization -->
<link rel="stylesheet" href="@ticketiq/design-system/css">
<script src="@ticketiq/design-system/font-loader.js"></script>
```

#### Font Loading Events
```javascript
document.addEventListener('fontsloaded', (event) => {
  console.log('Fonts loaded:', event.detail.loadedFonts);
  // Remove loading states, enable animations, etc.
});
```

### 4. Component Lazy Loading

#### React Components
```typescript
import { createLazyComponent, Skeleton } from '@ticketiq/design-system';

// Create lazy-loaded component
const LazyModal = createLazyComponent({
  name: 'modal',
  loader: () => import('./Modal'),
  fallback: <Skeleton variant="card" />
});

// Use in your app
function App() {
  return (
    <div>
      <LazyModal />
    </div>
  );
}
```

#### Image Lazy Loading
```typescript
import { LazyImage } from '@ticketiq/design-system';

function Gallery() {
  return (
    <LazyImage
      src="large-image.jpg"
      alt="Description"
      aspectRatio="16/9"
      fallback={<Skeleton variant="image" />}
    />
  );
}
```

### 5. Layout Shift Prevention

#### Skeleton Loading States
```typescript
import { Skeleton } from '@ticketiq/design-system';

function LoadingState() {
  return (
    <div>
      <Skeleton variant="text" />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="button" />
    </div>
  );
}
```

#### Aspect Ratio Containers
```css
/* Prevent image layout shift */
.aspect-ratio {
  aspect-ratio: 16/9;
}

.aspect-ratio img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## Performance Monitoring

### Built-in Metrics
```typescript
import { performanceOptimizer } from '@ticketiq/design-system';

// Measure performance
performanceOptimizer.measurePerformance();

// Monitor layout shifts
document.addEventListener('layoutshift', (event) => {
  if (event.detail.value > 0.1) {
    console.warn('Layout shift detected:', event.detail.value);
  }
});
```

### Performance Observer
```typescript
import { PerformanceMonitor } from '@ticketiq/design-system';

function App() {
  return (
    <PerformanceMonitor>
      <YourApp />
    </PerformanceMonitor>
  );
}
```

## Build Configuration

### Webpack Optimization
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        designSystem: {
          test: /[\\/]node_modules[\\/]@ticketiq[\\/]design-system/,
          name: 'design-system',
          chunks: 'all'
        }
      }
    }
  }
};
```

### Rollup Configuration
```javascript
// rollup.config.js
export default {
  external: ['@ticketiq/design-system'],
  output: {
    format: 'es' // Enable tree-shaking
  }
};
```

## Performance Targets

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Bundle Size Targets
- **Critical CSS**: < 15KB (gzipped)
- **Core components**: < 20KB (gzipped)
- **Full library**: < 60KB (gzipped)

## Best Practices

### 1. Import Strategy
- Use category-based imports for better tree-shaking
- Import only the components you actually use
- Prefer modular imports over full library imports

### 2. CSS Loading
- Inline critical CSS for above-the-fold content
- Lazy load non-critical styles
- Use preload hints for important resources

### 3. Font Loading
- Use system fonts as fallbacks
- Implement font-display: swap
- Preload critical font files

### 4. Image Optimization
- Use lazy loading for off-screen images
- Implement proper aspect ratios
- Provide appropriate fallbacks

### 5. Component Loading
- Use skeleton states during loading
- Implement progressive enhancement
- Monitor and minimize layout shifts

## Troubleshooting

### Common Issues

#### Large Bundle Size
```typescript
// Problem: Importing entire library
import { Button } from '@ticketiq/design-system';

// Solution: Use category imports
import { AccessibleButton } from '@ticketiq/design-system/core';
```

#### Layout Shifts
```typescript
// Problem: No size reservation
<img src="image.jpg" alt="Description" />

// Solution: Use aspect ratio container
<LazyImage src="image.jpg" alt="Description" aspectRatio="16/9" />
```

#### Font Loading Issues
```html
<!-- Problem: No font optimization -->
<link rel="stylesheet" href="styles.css">

<!-- Solution: Include font loader -->
<script src="@ticketiq/design-system/font-loader.js"></script>
```

## Performance Checklist

- [ ] Use modular imports for tree-shaking
- [ ] Implement critical CSS extraction
- [ ] Set up font loading optimization
- [ ] Add lazy loading for images and components
- [ ] Use skeleton loading states
- [ ] Monitor Core Web Vitals
- [ ] Test on slow networks and devices
- [ ] Validate bundle size targets

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Tree-shaking Guide](./TREE_SHAKING.md)
- [Font Optimization Guide](./FONT_OPTIMIZATION.md)
- [Accessibility Guide](./ACCESSIBILITY.md)