# Font Loading Optimization

The TicketIQ Design System includes comprehensive font loading optimization to prevent layout shift and improve performance.

## Features

- **Font Display Swap**: Prevents invisible text during font load
- **System Font Fallbacks**: Optimized fallback font stacks
- **Layout Shift Prevention**: Size-adjusted fallbacks
- **Progressive Loading**: Critical fonts first, then additional weights
- **Performance Monitoring**: Built-in metrics and reporting

## Usage

### Basic Implementation

```html
<!-- Include font optimization CSS -->
<link rel="stylesheet" href="@ticketiq/design-system/css">

<!-- Include font loader script -->
<script src="@ticketiq/design-system/font-loader.js"></script>
```

### Advanced Configuration

```javascript
// Custom font loading configuration
const fontLoader = new TicketIQFontLoader();

// Listen for font loading events
document.addEventListener('fontsloaded', (event) => {
  console.log('Fonts loaded:', event.detail.loadedFonts);
});
```

### Layout Shift Prevention

```html
<!-- Use skeleton loading states -->
<div class="skeleton btn-skeleton" data-component="button">
  <!-- Button will load here -->
</div>

<!-- Aspect ratio containers for images -->
<div class="aspect-ratio aspect-16-9">
  <img src="image.jpg" alt="Description" loading="lazy">
</div>
```

### Performance Utilities

```typescript
import { performanceOptimizer } from '@ticketiq/design-system/utilities';

// Lazy load components
performanceOptimizer.lazyLoad(element, 'modal');

// Preload critical components
performanceOptimizer.preloadCritical(['button', 'input']);

// Measure performance
performanceOptimizer.measurePerformance();
```

## Performance Benefits

- **Faster Initial Load**: Critical CSS and fonts loaded first
- **Reduced Layout Shift**: Proper size reservations and fallbacks
- **Better User Experience**: Smooth loading without flashes
- **Optimized Bundle Size**: Tree-shaking eliminates unused code

## Browser Support

- **Modern Browsers**: Full font loading API support
- **Legacy Browsers**: Graceful fallback with basic optimization
- **Progressive Enhancement**: Features work without JavaScript
