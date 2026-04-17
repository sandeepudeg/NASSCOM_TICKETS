# Performance Optimization Guide

The TicketIQ Design System is built with performance as a core principle, ensuring fast loading times, efficient rendering, and minimal bundle impact. This guide covers optimization strategies, monitoring techniques, and best practices.

## Performance Metrics

### Target Performance Goals
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Bundle Size Impact**: < 50KB gzipped for core components
- **Lighthouse Performance Score**: > 90

### Current Performance Metrics
```
Design System Core Bundle:
├── CSS: 28KB gzipped (85KB uncompressed)
├── JavaScript: 15KB gzipped (45KB uncompressed)
├── Fonts: 12KB (WOFF2 format)
└── Total: 55KB gzipped

Component Library:
├── React Components: 35KB gzipped (tree-shakeable)
├── Flask Templates: 8KB (server-rendered)
└── Utility Classes: 12KB gzipped
```

## Bundle Optimization

### Tree Shaking
The design system supports aggressive tree shaking to include only used components:

```javascript
// ✅ Good: Individual imports (recommended)
import Button from '@ticketiq/design-system/button';
import Input from '@ticketiq/design-system/input';

// ✅ Good: Named imports with tree-shaking
import { Button, Input } from '@ticketiq/design-system';

// ❌ Bad: Imports entire library
import * as DesignSystem from '@ticketiq/design-system';
```

### Webpack Configuration
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
          chunks: 'all',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@ticketiq/design-system': path.resolve(__dirname, 'node_modules/@ticketiq/design-system/dist/esm'),
    },
  },
};
```

### Rollup Configuration
```javascript
// rollup.config.js
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/design-system.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/design-system.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    }),
  ],
  external: ['react', 'react-dom'],
};
```

## CSS Optimization

### Critical CSS Extraction
```html
<!-- Inline critical CSS for above-the-fold content -->
<style>
  /* Critical design system styles */
  .ds-button { 
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 150ms ease;
  }
  
  .ds-button--primary {
    background-color: #4f46e5;
    color: white;
    border: 1px solid #4f46e5;
  }
  
  .ds-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }
</style>

<!-- Load full CSS asynchronously -->
<link rel="preload" href="/css/design-system.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/design-system.css"></noscript>
```

### PostCSS Optimization
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifySelectors: true,
        minifyParams: true,
      }],
    }),
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
      safelist: {
        standard: [/^ds-/, /^theme-/],
        deep: [/^ds-button/, /^ds-input/],
      },
    }),
  ],
};
```

### CSS Custom Properties Optimization
```css
/* Optimized CSS custom properties */
:root {
  /* Color tokens - optimized for compression */
  --c-p: #4f46e5;      /* primary */
  --c-s: #10b981;      /* success */
  --c-w: #f59e0b;      /* warning */
  --c-d: #ef4444;      /* danger */
  
  /* Spacing tokens - mathematical scale */
  --s-1: 0.25rem;      /* 4px */
  --s-2: 0.5rem;       /* 8px */
  --s-4: 1rem;         /* 16px */
  --s-6: 1.5rem;       /* 24px */
}

/* Expand to full names in development */
@media (min-width: 0) {
  :root {
    --color-primary: var(--c-p);
    --color-success: var(--c-s);
    --spacing-1: var(--s-1);
    --spacing-2: var(--s-2);
  }
}
```

## Font Optimization

### Font Loading Strategy
```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/segoe-ui-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/segoe-ui-semibold.woff2" as="font" type="font/woff2" crossorigin>

<!-- Font display optimization -->
<style>
  @font-face {
    font-family: 'Segoe UI';
    src: url('/fonts/segoe-ui-regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap; /* Prevent invisible text during font load */
  }
  
  @font-face {
    font-family: 'Segoe UI';
    src: url('/fonts/segoe-ui-semibold.woff2') format('woff2');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }
</style>
```

### Font Subsetting
```bash
# Generate optimized font subsets
pyftsubset segoe-ui-regular.ttf \
  --output-file=segoe-ui-regular-subset.woff2 \
  --flavor=woff2 \
  --layout-features=kern,liga \
  --unicodes=U+0020-007E,U+00A0-00FF,U+2010-2015,U+2018-201D,U+2020-2022

# Include only necessary characters
--unicodes-file=character-set.txt
```

### System Font Fallbacks
```css
/* Optimized font stack */
.ds-text {
  font-family: 
    'Segoe UI',           /* Windows */
    -apple-system,        /* macOS/iOS */
    BlinkMacSystemFont,   /* Chrome on macOS */
    'Roboto',             /* Android */
    'Helvetica Neue',     /* Older macOS */
    Arial,                /* Universal fallback */
    sans-serif;           /* Generic fallback */
}

/* Prevent layout shift during font load */
.ds-text {
  font-size-adjust: 0.5; /* Adjust based on primary font */
}
```

## JavaScript Optimization

### Code Splitting
```javascript
// Dynamic imports for heavy components
const Modal = lazy(() => import('@ticketiq/design-system/modal'));
const DataTable = lazy(() => import('@ticketiq/design-system/table'));
const Chart = lazy(() => import('@ticketiq/design-system/chart'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data" element={<DataTable />} />
        <Route path="/analytics" element={<Chart />} />
      </Routes>
    </Suspense>
  );
}
```

### Component Lazy Loading
```javascript
// Intersection Observer for lazy component loading
const LazyComponent = ({ children, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height: '200px' }} />}
    </div>
  );
};

// Usage
<LazyComponent>
  <ExpensiveChart data={chartData} />
</LazyComponent>
```

### Event Delegation
```javascript
// Efficient event handling for multiple components
class ComponentManager {
  constructor() {
    this.handleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.handleClick);
  }
  
  handleClick(event) {
    const button = event.target.closest('.ds-button');
    if (button) {
      this.handleButtonClick(button, event);
    }
    
    const dropdown = event.target.closest('.ds-dropdown__trigger');
    if (dropdown) {
      this.handleDropdownClick(dropdown, event);
    }
  }
  
  handleButtonClick(button, event) {
    // Handle button interactions
    if (button.classList.contains('ds-button--loading')) {
      event.preventDefault();
      return;
    }
    
    // Add ripple effect
    this.addRippleEffect(button, event);
  }
  
  addRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
    ripple.classList.add('ds-ripple');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}
```

## Image and Asset Optimization

### Responsive Images
```html
<!-- Responsive image with multiple formats -->
<picture>
  <source 
    srcset="/images/hero-320.avif 320w,
            /images/hero-640.avif 640w,
            /images/hero-1280.avif 1280w"
    type="image/avif"
  >
  <source 
    srcset="/images/hero-320.webp 320w,
            /images/hero-640.webp 640w,
            /images/hero-1280.webp 1280w"
    type="image/webp"
  >
  <img 
    src="/images/hero-640.jpg"
    srcset="/images/hero-320.jpg 320w,
            /images/hero-640.jpg 640w,
            /images/hero-1280.jpg 1280w"
    sizes="(max-width: 640px) 100vw,
           (max-width: 1280px) 50vw,
           25vw"
    alt="Hero image"
    loading="lazy"
    decoding="async"
  >
</picture>
```

### SVG Optimization
```javascript
// Inline critical SVG icons
const CriticalIcons = {
  close: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
};

// Lazy load non-critical icons
const IconLoader = {
  cache: new Map(),
  
  async loadIcon(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }
    
    const response = await fetch(`/icons/${name}.svg`);
    const svg = await response.text();
    this.cache.set(name, svg);
    return svg;
  }
};
```

## Runtime Performance

### Virtual Scrolling
```javascript
// Virtual scrolling for large lists
const VirtualList = ({ items, itemHeight = 50, containerHeight = 400 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div 
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Memoization and Optimization
```javascript
// Optimized component with memoization
const OptimizedButton = memo(({ 
  variant, 
  size, 
  children, 
  onClick,
  ...props 
}) => {
  const buttonClass = useMemo(() => 
    `ds-button ds-button--${variant} ds-button--${size}`,
    [variant, size]
  );
  
  const handleClick = useCallback((event) => {
    if (onClick) {
      onClick(event);
    }
  }, [onClick]);
  
  return (
    <button 
      className={buttonClass}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});

// Custom hook for debounced values
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};
```

## Monitoring and Measurement

### Performance Monitoring Setup
```javascript
// Performance monitoring with Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
}

// Measure all Web Vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Custom performance marks
performance.mark('design-system-start');
// ... design system initialization
performance.mark('design-system-end');
performance.measure('design-system-init', 'design-system-start', 'design-system-end');
```

### Bundle Analysis
```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/static/js/*.js

# Source Map Explorer
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'

# Bundle size tracking
npm install --save-dev bundlesize
```

```json
// package.json
{
  "bundlesize": [
    {
      "path": "./dist/design-system.min.js",
      "maxSize": "20 kB"
    },
    {
      "path": "./dist/design-system.min.css",
      "maxSize": "30 kB"
    }
  ]
}
```

### Lighthouse CI Integration
```yaml
# .github/workflows/performance.yml
name: Performance Testing

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build project
        run: npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm start',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## Performance Best Practices

### Development Guidelines

#### Do's
- Use tree-shaking friendly imports
- Implement lazy loading for heavy components
- Optimize images and use modern formats (WebP, AVIF)
- Minimize CSS and JavaScript bundles
- Use CSS custom properties for theming
- Implement proper caching strategies
- Monitor performance metrics continuously

#### Don'ts
- Don't import entire libraries when only using specific components
- Don't inline large CSS or JavaScript files
- Don't use unoptimized images
- Don't block rendering with synchronous scripts
- Don't ignore performance budgets
- Don't skip performance testing in CI/CD

### Caching Strategy
```javascript
// Service Worker for design system assets
const CACHE_NAME = 'design-system-v1.0.0';
const STATIC_ASSETS = [
  '/css/design-system.css',
  '/js/design-system.js',
  '/fonts/segoe-ui-regular.woff2',
  '/fonts/segoe-ui-semibold.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (STATIC_ASSETS.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});
```

### HTTP/2 Optimization
```nginx
# Nginx configuration for HTTP/2 and compression
server {
    listen 443 ssl http2;
    
    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/css
        text/javascript
        application/javascript
        application/json
        image/svg+xml;
    
    # Enable Brotli compression
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/css
        text/javascript
        application/javascript
        application/json
        image/svg+xml;
    
    # Cache static assets
    location ~* \.(css|js|woff2|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Preload critical resources
    location = / {
        add_header Link "</css/design-system.css>; rel=preload; as=style";
        add_header Link "</js/design-system.js>; rel=preload; as=script";
    }
}
```

## Performance Budget

### Budget Targets
```json
{
  "budget": {
    "javascript": "50KB",
    "css": "30KB",
    "fonts": "15KB",
    "images": "100KB",
    "total": "200KB"
  },
  "thresholds": {
    "fcp": 1500,
    "lcp": 2500,
    "cls": 0.1,
    "fid": 100,
    "ttfb": 600
  }
}
```

### Monitoring Dashboard
```javascript
// Performance dashboard metrics
const PerformanceDashboard = {
  metrics: {
    bundleSize: {
      current: '45KB',
      target: '50KB',
      status: 'good'
    },
    lighthouse: {
      performance: 94,
      accessibility: 98,
      bestPractices: 92,
      seo: 95
    },
    webVitals: {
      fcp: 1.2,
      lcp: 2.1,
      cls: 0.05,
      fid: 85
    }
  },
  
  alerts: [
    {
      type: 'warning',
      message: 'Bundle size approaching limit (45KB/50KB)'
    }
  ]
};
```