#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Font Loading Optimization Script
 * Generates optimized font loading strategies with proper fallbacks
 */

console.log('🔤 Setting up font loading optimization...\n');

// Font configuration based on design tokens
const fontConfig = {
  primary: {
    family: 'Segoe UI',
    fallbacks: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
    weights: [400, 500, 600, 700],
    display: 'swap'
  },
  monospace: {
    family: 'SF Mono',
    fallbacks: ['Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
    weights: [400, 500, 600],
    display: 'swap'
  }
};

function generateFontFaceCSS() {
  let fontCSS = `/* TicketIQ Design System - Optimized Font Loading */\n\n`;
  
  // Add font-display: swap for better performance
  fontCSS += `/* Font Display Optimization */\n`;
  fontCSS += `@supports (font-display: swap) {\n`;
  fontCSS += `  * {\n`;
  fontCSS += `    font-display: swap;\n`;
  fontCSS += `  }\n`;
  fontCSS += `}\n\n`;
  
  // System font stack with optimized fallbacks
  fontCSS += `/* Optimized System Font Stacks */\n`;
  fontCSS += `:root {\n`;
  fontCSS += `  --font-family-sans: ${fontConfig.primary.fallbacks.join(', ')};\n`;
  fontCSS += `  --font-family-mono: ${fontConfig.monospace.fallbacks.join(', ')};\n`;
  fontCSS += `}\n\n`;
  
  // Font loading optimization
  fontCSS += `/* Font Loading Performance */\n`;
  fontCSS += `body {\n`;
  fontCSS += `  font-family: var(--font-family-sans);\n`;
  fontCSS += `  font-display: swap;\n`;
  fontCSS += `  text-rendering: optimizeSpeed;\n`;
  fontCSS += `}\n\n`;
  
  // Prevent layout shift during font loading
  fontCSS += `/* Prevent Layout Shift */\n`;
  fontCSS += `.font-loading {\n`;
  fontCSS += `  visibility: hidden;\n`;
  fontCSS += `}\n\n`;
  fontCSS += `.font-loaded {\n`;
  fontCSS += `  visibility: visible;\n`;
  fontCSS += `}\n\n`;
  
  // Size adjust for better fallback matching
  fontCSS += `/* Size Adjust for Fallback Fonts */\n`;
  fontCSS += `@font-face {\n`;
  fontCSS += `  font-family: 'Segoe UI Fallback';\n`;
  fontCSS += `  src: local('system-ui');\n`;
  fontCSS += `  size-adjust: 100%;\n`;
  fontCSS += `  ascent-override: 90%;\n`;
  fontCSS += `  descent-override: 22%;\n`;
  fontCSS += `  line-gap-override: 0%;\n`;
  fontCSS += `}\n\n`;
  
  const fontPath = path.join(__dirname, '..', 'src', 'styles', 'fonts.css');
  fs.writeFileSync(fontPath, fontCSS);
  console.log('📝 Generated optimized font CSS');
}

function generateFontLoadingScript() {
  const fontLoadingScript = `/**
 * TicketIQ Design System - Font Loading Optimization
 * Implements font loading strategies to prevent layout shift and improve performance
 */

(function() {
  'use strict';
  
  // Font loading configuration
  const FONT_CONFIG = {
    timeout: 3000, // 3 second timeout
    fallbackDelay: 100 // 100ms delay before showing fallback
  };
  
  // Check if Font Loading API is supported
  const supportsFontLoading = 'fonts' in document;
  
  class FontLoader {
    constructor() {
      this.loadedFonts = new Set();
      this.fontPromises = new Map();
      this.init();
    }
    
    init() {
      // Add font-loading class to prevent FOIT (Flash of Invisible Text)
      document.documentElement.classList.add('font-loading');
      
      if (supportsFontLoading) {
        this.loadFontsWithAPI();
      } else {
        this.loadFontsWithFallback();
      }
    }
    
    async loadFontsWithAPI() {
      try {
        // Define critical fonts to load immediately
        const criticalFonts = [
          { family: 'Segoe UI', weight: '400' },
          { family: 'Segoe UI', weight: '600' }
        ];
        
        // Load critical fonts first
        const criticalPromises = criticalFonts.map(font => 
          this.loadFont(font.family, font.weight)
        );
        
        // Wait for critical fonts or timeout
        await Promise.race([
          Promise.all(criticalPromises),
          this.timeout(FONT_CONFIG.timeout)
        ]);
        
        this.onFontsLoaded();
        
        // Load remaining fonts in background
        this.loadNonCriticalFonts();
        
      } catch (error) {
        console.warn('Font loading failed, using fallbacks:', error);
        this.onFontsLoaded();
      }
    }
    
    async loadFont(family, weight = '400', style = 'normal') {
      const fontKey = \`\${family}-\${weight}-\${style}\`;
      
      if (this.loadedFonts.has(fontKey)) {
        return Promise.resolve();
      }
      
      if (this.fontPromises.has(fontKey)) {
        return this.fontPromises.get(fontKey);
      }
      
      const fontFace = new FontFace(family, \`local('\${family}')\`, {
        weight,
        style,
        display: 'swap'
      });
      
      const promise = fontFace.load().then(() => {
        document.fonts.add(fontFace);
        this.loadedFonts.add(fontKey);
        return fontFace;
      });
      
      this.fontPromises.set(fontKey, promise);
      return promise;
    }
    
    loadFontsWithFallback() {
      // Fallback method for browsers without Font Loading API
      const testString = 'BESbswy';
      const fallbackFont = 'monospace';
      const testSize = '100px';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Measure fallback font
      context.font = testSize + ' ' + fallbackFont;
      const fallbackWidth = context.measureText(testString).width;
      
      // Test if system font is available
      context.font = testSize + ' Segoe UI, ' + fallbackFont;
      const testWidth = context.measureText(testString).width;
      
      if (testWidth !== fallbackWidth) {
        this.onFontsLoaded();
      } else {
        // Font not available, use fallback
        setTimeout(() => this.onFontsLoaded(), FONT_CONFIG.fallbackDelay);
      }
    }
    
    loadNonCriticalFonts() {
      // Load additional font weights in background
      const nonCriticalFonts = [
        { family: 'Segoe UI', weight: '500' },
        { family: 'Segoe UI', weight: '700' }
      ];
      
      nonCriticalFonts.forEach(font => {
        this.loadFont(font.family, font.weight).catch(() => {
          // Ignore errors for non-critical fonts
        });
      });
    }
    
    onFontsLoaded() {
      document.documentElement.classList.remove('font-loading');
      document.documentElement.classList.add('font-loaded');
      
      // Dispatch custom event
      const event = new CustomEvent('fontsloaded', {
        detail: { loadedFonts: Array.from(this.loadedFonts) }
      });
      document.dispatchEvent(event);
    }
    
    timeout(ms) {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Font loading timeout')), ms);
      });
    }
  }
  
  // Preload critical fonts
  function preloadFonts() {
    const preloadFonts = [
      'Segoe UI'
    ];
    
    preloadFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = \`data:font/woff2;base64,\`; // Would contain actual font data
      document.head.appendChild(link);
    });
  }
  
  // Initialize font loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new FontLoader();
    });
  } else {
    new FontLoader();
  }
  
  // Preload fonts immediately
  preloadFonts();
  
  // Export for manual usage
  window.TicketIQFontLoader = FontLoader;
})();`;

  const scriptPath = path.join(__dirname, '..', 'dist', 'font-loader.js');
  fs.writeFileSync(scriptPath, fontLoadingScript);
  
  // Create minified version
  const minifiedScript = fontLoadingScript
    .replace(/\/\*\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/;\s*}/g, ';}') // Remove spaces before closing braces
    .trim();
  
  const scriptMinPath = path.join(__dirname, '..', 'dist', 'font-loader.min.js');
  fs.writeFileSync(scriptMinPath, minifiedScript);
  
  // CDN versions
  const cdnDir = path.join(__dirname, '..', 'dist', 'cdn');
  if (!fs.existsSync(cdnDir)) {
    fs.mkdirSync(cdnDir, { recursive: true });
  }
  
  const header = `/*! TicketIQ Design System Font Loader v${require('../package.json').version} | MIT License */\n`;
  
  fs.writeFileSync(
    path.join(cdnDir, 'ticketiq-font-loader.js'),
    header + fontLoadingScript
  );
  fs.writeFileSync(
    path.join(cdnDir, 'ticketiq-font-loader.min.js'),
    header + minifiedScript
  );
  
  console.log('📜 Generated font loading script');
}

function generateLayoutShiftPrevention() {
  const layoutShiftCSS = `/* TicketIQ Design System - Layout Shift Prevention */

/* Skeleton Loading States */
.skeleton {
  background: linear-gradient(90deg, 
    var(--color-theme-bg2) 25%, 
    var(--color-theme-bg3) 50%, 
    var(--color-theme-bg2) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Component Size Reservations */
.btn-skeleton {
  height: 2.5rem; /* Match button height */
  width: 6rem; /* Typical button width */
  border-radius: var(--borderRadius-md);
}

.input-skeleton {
  height: 2.5rem; /* Match input height */
  width: 100%;
  border-radius: var(--borderRadius-sm);
}

.card-skeleton {
  height: 12rem; /* Typical card height */
  width: 100%;
  border-radius: var(--borderRadius-lg);
}

.text-skeleton {
  height: 1.2em; /* Match line height */
  width: 100%;
  border-radius: var(--borderRadius-sm);
  margin-bottom: 0.5em;
}

.text-skeleton.short {
  width: 60%;
}

.text-skeleton.medium {
  width: 80%;
}

/* Image Loading States */
.img-skeleton {
  background: var(--color-theme-bg2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-theme-textMuted);
}

.img-skeleton::before {
  content: '📷';
  font-size: 2rem;
  opacity: 0.5;
}

/* Prevent Layout Shift During Loading */
.loading-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.loading-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Font Loading States */
.font-loading * {
  visibility: hidden;
}

.font-loading .critical-text {
  visibility: visible;
  font-family: system-ui, -apple-system, sans-serif;
}

.font-loaded * {
  visibility: visible;
}

/* Aspect Ratio Containers (prevent image layout shift) */
.aspect-ratio {
  position: relative;
  width: 100%;
}

.aspect-ratio::before {
  content: '';
  display: block;
  padding-top: var(--aspect-ratio, 56.25%); /* 16:9 default */
}

.aspect-ratio > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Common aspect ratios */
.aspect-16-9 { --aspect-ratio: 56.25%; }
.aspect-4-3 { --aspect-ratio: 75%; }
.aspect-1-1 { --aspect-ratio: 100%; }
.aspect-3-2 { --aspect-ratio: 66.67%; }

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: var(--color-theme-bg2);
  }
}`;

  const layoutShiftPath = path.join(__dirname, '..', 'src', 'styles', 'layout-shift-prevention.css');
  fs.writeFileSync(layoutShiftPath, layoutShiftCSS);
  console.log('🎯 Generated layout shift prevention CSS');
}

function generatePerformanceUtilities() {
  const performanceUtils = `/**
 * TicketIQ Design System - Performance Utilities
 * Helper functions for optimizing component loading and performance
 */

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private observer: IntersectionObserver | null = null;
  private loadedComponents = new Set<string>();
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  
  constructor() {
    this.setupIntersectionObserver();
  }
  
  private setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.loadComponent(entry.target as HTMLElement);
            }
          });
        },
        {
          rootMargin: '50px', // Load 50px before entering viewport
          threshold: 0.1
        }
      );
    }
  }
  
  /**
   * Register a component for lazy loading
   */
  lazyLoad(element: HTMLElement, componentName: string): void {
    if (this.observer && !this.loadedComponents.has(componentName)) {
      element.setAttribute('data-component', componentName);
      this.observer.observe(element);
    }
  }
  
  /**
   * Load a component when it enters the viewport
   */
  private async loadComponent(element: HTMLElement): Promise<void> {
    const componentName = element.getAttribute('data-component');
    if (!componentName || this.loadedComponents.has(componentName)) {
      return;
    }
    
    try {
      // Remove skeleton loading state
      element.classList.remove('skeleton');
      
      // Mark as loaded
      this.loadedComponents.add(componentName);
      
      // Stop observing this element
      if (this.observer) {
        this.observer.unobserve(element);
      }
      
      // Dispatch loaded event
      const event = new CustomEvent('componentLoaded', {
        detail: { componentName, element }
      });
      element.dispatchEvent(event);
      
    } catch (error) {
      console.warn(\`Failed to load component \${componentName}:\`, error);
    }
  }
  
  /**
   * Preload critical components
   */
  preloadCritical(components: string[]): void {
    components.forEach(component => {
      this.loadedComponents.add(component);
    });
  }
  
  /**
   * Measure and report performance metrics
   */
  measurePerformance(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Measure paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        console.log(\`\${entry.name}: \${entry.startTime}ms\`);
      });
      
      // Measure layout shift
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            console.warn(\`Cumulative Layout Shift: \${clsValue}\`);
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
      }
    }
  }
  
  /**
   * Optimize images for better performance
   */
  optimizeImages(): void {
    const images = document.querySelectorAll('img[data-optimize]');
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      
      // Add loading="lazy" for off-screen images
      if (!imageElement.loading) {
        imageElement.loading = 'lazy';
      }
      
      // Add decoding="async" for better performance
      if (!imageElement.decoding) {
        imageElement.decoding = 'async';
      }
      
      // Set up aspect ratio to prevent layout shift
      const aspectRatio = imageElement.getAttribute('data-aspect-ratio');
      if (aspectRatio && imageElement.parentElement) {
        imageElement.parentElement.style.aspectRatio = aspectRatio;
      }
    });
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedComponents.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceOptimizer.measurePerformance();
      performanceOptimizer.optimizeImages();
    });
  } else {
    performanceOptimizer.measurePerformance();
    performanceOptimizer.optimizeImages();
  }
}`;

  const utilsPath = path.join(__dirname, '..', 'src', 'utils', 'performance.ts');
  fs.writeFileSync(utilsPath, performanceUtils);
  console.log('⚡ Generated performance utilities');
}

function generateUsageDocumentation() {
  const docContent = `# Font Loading Optimization

The TicketIQ Design System includes comprehensive font loading optimization to prevent layout shift and improve performance.

## Features

- **Font Display Swap**: Prevents invisible text during font load
- **System Font Fallbacks**: Optimized fallback font stacks
- **Layout Shift Prevention**: Size-adjusted fallbacks
- **Progressive Loading**: Critical fonts first, then additional weights
- **Performance Monitoring**: Built-in metrics and reporting

## Usage

### Basic Implementation

\`\`\`html
<!-- Include font optimization CSS -->
<link rel="stylesheet" href="@ticketiq/design-system/css">

<!-- Include font loader script -->
<script src="@ticketiq/design-system/font-loader.js"></script>
\`\`\`

### Advanced Configuration

\`\`\`javascript
// Custom font loading configuration
const fontLoader = new TicketIQFontLoader();

// Listen for font loading events
document.addEventListener('fontsloaded', (event) => {
  console.log('Fonts loaded:', event.detail.loadedFonts);
});
\`\`\`

### Layout Shift Prevention

\`\`\`html
<!-- Use skeleton loading states -->
<div class="skeleton btn-skeleton" data-component="button">
  <!-- Button will load here -->
</div>

<!-- Aspect ratio containers for images -->
<div class="aspect-ratio aspect-16-9">
  <img src="image.jpg" alt="Description" loading="lazy">
</div>
\`\`\`

### Performance Utilities

\`\`\`typescript
import { performanceOptimizer } from '@ticketiq/design-system/utilities';

// Lazy load components
performanceOptimizer.lazyLoad(element, 'modal');

// Preload critical components
performanceOptimizer.preloadCritical(['button', 'input']);

// Measure performance
performanceOptimizer.measurePerformance();
\`\`\`

## Performance Benefits

- **Faster Initial Load**: Critical CSS and fonts loaded first
- **Reduced Layout Shift**: Proper size reservations and fallbacks
- **Better User Experience**: Smooth loading without flashes
- **Optimized Bundle Size**: Tree-shaking eliminates unused code

## Browser Support

- **Modern Browsers**: Full font loading API support
- **Legacy Browsers**: Graceful fallback with basic optimization
- **Progressive Enhancement**: Features work without JavaScript
`;

  const docPath = path.join(__dirname, '..', 'FONT_OPTIMIZATION.md');
  fs.writeFileSync(docPath, docContent);
  console.log('📖 Generated font optimization documentation');
}

// Execute all font optimization functions
async function setupFontOptimization() {
  try {
    generateFontFaceCSS();
    generateFontLoadingScript();
    generateLayoutShiftPrevention();
    generatePerformanceUtilities();
    generateUsageDocumentation();
    
    console.log('\n✅ Font loading optimization setup completed!');
    console.log('\n📊 Benefits:');
    console.log('   - Prevents layout shift during font loading');
    console.log('   - Optimized system font fallbacks');
    console.log('   - Progressive font loading strategy');
    console.log('   - Performance monitoring and metrics');
    
  } catch (error) {
    console.error('❌ Font optimization setup failed:', error.message);
    process.exit(1);
  }
}

setupFontOptimization();