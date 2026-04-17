# TicketIQ Design System - Animation and Interaction Standards

## Overview

The TicketIQ Design System provides a comprehensive animation and interaction system that ensures consistent, performant, and accessible animations across all interfaces. The system follows modern web standards and best practices for 60fps animations while respecting user accessibility preferences.

## Key Features

- **Standard Animation Tokens**: Consistent durations, easing curves, and delays
- **Performance Optimized**: Hardware-accelerated animations targeting 60fps
- **Accessibility First**: Full support for `prefers-reduced-motion`
- **Comprehensive Components**: Loading states, micro-interactions, and transitions
- **Cross-Platform**: Works seamlessly in React and Flask applications

## Animation Tokens

### Transition Durations

```css
--transition-duration-fast: 150ms      /* Quick interactions */
--transition-duration-normal: 250ms    /* Standard transitions */
--transition-duration-slow: 400ms      /* Deliberate animations */
--transition-duration-slower: 600ms    /* Emphasis animations */
```

### Animation Durations

```css
--animation-duration-fast: 200ms       /* Quick animations */
--animation-duration-normal: 300ms     /* Standard animations */
--animation-duration-slow: 500ms       /* Slower animations */
--animation-duration-loading: 1.5s     /* Loading indicators */
--animation-duration-pulse: 2s         /* Pulse animations */
```

### Easing Curves

```css
--transition-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1)        /* Material Design */
--transition-easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)  /* Spring effect */
--transition-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)   /* Bounce effect */
--transition-easing-sharp: cubic-bezier(0.4, 0, 0.6, 1)        /* Sharp transitions */
```

### Animation Delays

```css
--animation-delay-none: 0ms
--animation-delay-short: 100ms
--animation-delay-medium: 200ms
--animation-delay-long: 300ms
```

## Loading Animations

### Spinner Component

```html
<!-- Basic spinner -->
<div class="spinner" role="status" aria-label="Loading">
  <span class="sr-only">Loading...</span>
</div>

<!-- Size variants -->
<div class="spinner spinner-sm"></div>
<div class="spinner spinner-lg"></div>
<div class="spinner spinner-xl"></div>
```

### Skeleton Loading

```html
<!-- Text skeleton -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text" style="width: 80%;"></div>

<!-- Avatar skeleton -->
<div class="skeleton skeleton-avatar"></div>

<!-- Button skeleton -->
<div class="skeleton skeleton-button"></div>
```

### Progress Indicators

```html
<!-- Determinate progress -->
<div class="progress-bar" role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-bar-fill" style="width: 65%;"></div>
</div>

<!-- Indeterminate progress -->
<div class="progress-bar progress-bar-indeterminate">
  <div class="progress-bar-fill"></div>
</div>
```

## Interaction States

### Hover Effects

```html
<!-- Lift effect -->
<div class="hover-lift">Hover to lift</div>

<!-- Scale effect -->
<div class="hover-scale">Hover to scale</div>

<!-- Glow effect -->
<div class="hover-glow">Hover for glow</div>

<!-- Fade effect -->
<div class="hover-fade">Hover to fade</div>
```

### Focus Effects

```html
<!-- Focus ring -->
<input class="focus-ring" type="text" placeholder="Focus for ring">

<!-- Focus scale -->
<button class="focus-scale">Focus to scale</button>
```

### Press/Active Effects

```html
<!-- Press scale -->
<button class="press-scale">Press to scale down</button>

<!-- Press fade -->
<button class="press-fade">Press to fade</button>
```

## Entrance Animations

### Basic Animations

```html
<!-- Fade in -->
<div class="animate-fadeIn">Fade in animation</div>

<!-- Slide animations -->
<div class="animate-slideInUp">Slide in from bottom</div>
<div class="animate-slideInDown">Slide in from top</div>
<div class="animate-slideInLeft">Slide in from left</div>
<div class="animate-slideInRight">Slide in from right</div>

<!-- Scale animations -->
<div class="animate-scaleIn">Scale in animation</div>
```

### Staggered Animations

```html
<div class="stagger-children">
  <div>Item 1 (0ms delay)</div>
  <div>Item 2 (100ms delay)</div>
  <div>Item 3 (200ms delay)</div>
  <div>Item 4 (300ms delay)</div>
  <div>Item 5 (400ms delay)</div>
</div>
```

## Component Animations

### Modal Animations

```html
<div class="modal-backdrop">
  <div class="modal-content">
    <h3>Animated Modal</h3>
    <p>Content with entrance animation</p>
  </div>
</div>
```

### Toast Notifications

```html
<div class="toast-enter">
  <div>Success! Operation completed.</div>
</div>
```

### Dropdown Animations

```html
<div class="dropdown-enter">
  <div>Dropdown content</div>
</div>
```

## React Components

### AnimatedButton

```tsx
import { AnimatedButton } from '@ticketiq/design-system';

<AnimatedButton 
  variant="primary" 
  loading={isLoading}
  ripple={true}
>
  Click Me
</AnimatedButton>
```

### Loading Components

```tsx
import { Spinner, Skeleton, ProgressBar } from '@ticketiq/design-system';

// Spinner
<Spinner size="lg" />

// Skeleton
<Skeleton variant="text" />
<Skeleton variant="avatar" />

// Progress bar
<ProgressBar value={65} />
<ProgressBar indeterminate />
```

### Modal Component

```tsx
import { Modal } from '@ticketiq/design-system';

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Animated Modal"
>
  <p>Modal content with animations</p>
</Modal>
```

### Toast System

```tsx
import { ToastProvider, useToast } from '@ticketiq/design-system';

function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
}

function MyComponent() {
  const { addToast } = useToast();
  
  const showSuccess = () => {
    addToast({
      message: 'Operation successful!',
      type: 'success',
      duration: 5000
    });
  };
}
```

## Performance Optimizations

### Hardware Acceleration

```html
<!-- GPU acceleration -->
<div class="gpu-accelerated">Hardware accelerated element</div>

<!-- Will-change optimization -->
<div class="will-animate">Element that will animate</div>
<div class="will-animate-transform">Element that will transform</div>
<div class="will-animate-opacity">Element that will fade</div>
```

### 60fps Guidelines

The animation system follows these performance principles:

1. **Use `transform` and `opacity`** for animations (composited properties)
2. **Avoid animating layout properties** like `width`, `height`, `top`, `left`
3. **Apply `will-change`** to elements before animation
4. **Remove `will-change`** after animation completes
5. **Use hardware acceleration** with `translateZ(0)`

### Performance Classes

```css
/* Apply before animating */
.will-animate { will-change: transform, opacity; }

/* Apply for hardware acceleration */
.gpu-accelerated { transform: translateZ(0); }

/* Remove after animation */
.animation-complete { will-change: auto; }
```

## Accessibility Support

### Reduced Motion

The system automatically respects the user's `prefers-reduced-motion` setting:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

All loading components include proper ARIA attributes:

```html
<div class="spinner" role="status" aria-label="Loading">
  <span class="sr-only">Loading...</span>
</div>

<div class="progress-bar" 
     role="progressbar" 
     aria-valuenow="65" 
     aria-valuemin="0" 
     aria-valuemax="100">
  <div class="progress-bar-fill" style="width: 65%;"></div>
</div>
```

### Focus Management

Focus indicators are clearly visible and respect high contrast mode:

```css
.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5);
}

@media (prefers-contrast: high) {
  .focus-ring:focus-visible {
    box-shadow: 0 0 0 3px currentColor;
  }
}
```

## Micro-Interactions

### Button Ripple Effect

```html
<button class="btn-ripple">
  Button with ripple effect
</button>
```

### Toggle Switch

```html
<label class="toggle-switch">
  <input type="checkbox">
  <span class="toggle-slider"></span>
</label>
```

### Interactive Cards

```html
<div class="card-interactive">
  <h3>Interactive Card</h3>
  <p>Hover for lift effect</p>
</div>
```

## Animation Utilities

### Control Classes

```html
<!-- Animation control -->
<div class="animate-paused">Paused animation</div>
<div class="animate-running">Running animation</div>

<!-- Transform utilities -->
<div class="transform-gpu">GPU accelerated</div>
<div class="transform-none">No transform</div>
```

### Transition Utilities

```html
<!-- Transition control -->
<div class="transition-none">No transitions</div>
<div class="transition-all">All properties transition</div>
<div class="transition-colors">Color transitions only</div>
<div class="transition-transform">Transform transitions only</div>
<div class="transition-opacity">Opacity transitions only</div>
```

## Best Practices

### Do's

- ✅ Use design tokens for consistent timing
- ✅ Apply hardware acceleration for smooth animations
- ✅ Respect `prefers-reduced-motion` settings
- ✅ Use `transform` and `opacity` for 60fps performance
- ✅ Provide meaningful loading states
- ✅ Include proper ARIA labels for screen readers

### Don'ts

- ❌ Don't animate layout properties (`width`, `height`, `top`, `left`)
- ❌ Don't use animations longer than 600ms for interactions
- ❌ Don't ignore accessibility preferences
- ❌ Don't animate without purpose
- ❌ Don't forget to clean up `will-change` after animations

## Browser Support

The animation system supports:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Graceful degradation is provided for older browsers through CSS feature detection.

## Testing

Animation functionality is tested through:

1. **Token Generation Tests**: Verify all animation tokens are properly generated
2. **CSS Class Tests**: Ensure animation classes are available
3. **Accessibility Tests**: Confirm reduced motion support
4. **Performance Tests**: Validate 60fps optimizations

Run tests with:

```bash
npm test animation-tokens.test.js
```

## Migration Guide

### From Previous Version

If migrating from a previous animation system:

1. Replace custom animation durations with design tokens
2. Update easing curves to use the new token system
3. Add `gpu-accelerated` class to animated elements
4. Ensure `prefers-reduced-motion` support is implemented
5. Update loading states to use new components

### Integration Steps

1. Import the animation CSS:
   ```css
   @import '@ticketiq/design-system/dist/styles.css';
   ```

2. Use React components:
   ```tsx
   import { Spinner, AnimatedButton } from '@ticketiq/design-system';
   ```

3. Apply utility classes:
   ```html
   <div class="hover-lift animate-fadeIn">Content</div>
   ```

## Performance Monitoring

Monitor animation performance using:

```javascript
// Performance API
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      console.log(`Animation: ${entry.name} took ${entry.duration}ms`);
    }
  }
});
observer.observe({ entryTypes: ['measure'] });
```

## Support

For questions or issues with the animation system:

1. Check the [demo page](./demo-animations.html) for examples
2. Review the [test files](./tests/) for implementation details
3. Consult the [design tokens](./dist/css/variables.css) for available values

The animation system is designed to provide smooth, accessible, and performant interactions that enhance the user experience while maintaining consistency across the TicketIQ platform.