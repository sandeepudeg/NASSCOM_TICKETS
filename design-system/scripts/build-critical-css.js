#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

/**
 * Critical CSS Extraction Script
 * Extracts above-the-fold CSS for performance optimization
 */

console.log('🎯 Extracting critical CSS...\n');

// Define critical CSS selectors (above-the-fold content)
const criticalSelectors = [
  // Base styles
  'html', 'body', '*', '*::before', '*::after',
  
  // Typography (visible immediately)
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a',
  
  // Layout containers (visible immediately)
  '.container', '.container-fluid', '.row', '.col',
  
  // Navigation (above-the-fold)
  'nav', '.navbar', '.nav-link', '.breadcrumb',
  
  // Critical utility classes
  '.d-block', '.d-flex', '.d-none', '.text-center', '.text-left', '.text-right',
  '.justify-center', '.align-center', '.flex-column', '.flex-row',
  
  // Critical spacing (for layout)
  '.m-0', '.m-1', '.m-2', '.m-3', '.m-4',
  '.p-0', '.p-1', '.p-2', '.p-3', '.p-4',
  '.mt-0', '.mt-1', '.mt-2', '.mt-3', '.mt-4',
  '.mb-0', '.mb-1', '.mb-2', '.mb-3', '.mb-4',
  
  // Theme variables (always needed)
  ':root',
  
  // Loading states (prevent layout shift)
  '.loading', '.skeleton', '.spinner',
  
  // Critical components (buttons, forms visible immediately)
  '.btn', '.btn-primary', '.btn-secondary',
  '.form-control', '.form-group', '.form-label',
  
  // Responsive utilities for mobile-first
  '@media (max-width: 640px)',
  '@media (max-width: 768px)',
  
  // Accessibility (always critical)
  '.sr-only', '[aria-hidden]', '[role]',
  
  // Focus states (accessibility)
  ':focus', ':focus-visible'
];

// Define non-critical selectors (can be lazy loaded)
const nonCriticalSelectors = [
  // Complex animations
  '@keyframes', '.animate-', '.transition-',
  
  // Modal and overlay components
  '.modal', '.overlay', '.dropdown', '.tooltip', '.popover',
  
  // Advanced utility classes
  '.shadow-', '.rounded-', '.border-',
  
  // Large spacing utilities
  '.m-5', '.m-6', '.m-8', '.p-5', '.p-6', '.p-8',
  '.mt-5', '.mt-6', '.mt-8', '.mb-5', '.mb-6', '.mb-8',
  
  // Print styles
  '@media print',
  
  // High contrast and reduced motion (can be loaded on demand)
  '@media (prefers-contrast: high)',
  '@media (prefers-reduced-motion: reduce)'
];

async function extractCriticalCSS() {
  try {
    const cssPath = path.join(__dirname, '..', 'dist', 'styles.css');
    
    if (!fs.existsSync(cssPath)) {
      throw new Error('Built CSS file not found. Run npm run build:css first.');
    }
    
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Parse CSS with PostCSS
    const root = postcss.parse(css);
    
    const criticalRules = [];
    const nonCriticalRules = [];
    
    root.walkRules(rule => {
      const selector = rule.selector;
      const isCritical = criticalSelectors.some(criticalSelector => {
        if (criticalSelector.startsWith('@media')) {
          return rule.parent && rule.parent.type === 'atrule' && 
                 rule.parent.params.includes(criticalSelector.replace('@media ', ''));
        }
        return selector.includes(criticalSelector) || 
               selector === criticalSelector ||
               (criticalSelector === '*' && selector.match(/^[*]|^[*]::/));
      });
      
      if (isCritical) {
        criticalRules.push(rule.clone());
      } else {
        nonCriticalRules.push(rule.clone());
      }
    });
    
    // Handle at-rules (media queries, keyframes, etc.)
    root.walkAtRules(atRule => {
      const isCritical = criticalSelectors.some(criticalSelector => {
        if (criticalSelector.startsWith('@media')) {
          return atRule.name === 'media' && 
                 atRule.params.includes(criticalSelector.replace('@media ', ''));
        }
        return false;
      });
      
      if (isCritical) {
        criticalRules.push(atRule.clone());
      } else {
        nonCriticalRules.push(atRule.clone());
      }
    });
    
    // Create critical CSS
    const criticalRoot = postcss.root();
    criticalRules.forEach(rule => criticalRoot.append(rule));
    
    // Create non-critical CSS
    const nonCriticalRoot = postcss.root();
    nonCriticalRules.forEach(rule => nonCriticalRoot.append(rule));
    
    // Write critical CSS
    const criticalCSS = criticalRoot.toString();
    const criticalPath = path.join(__dirname, '..', 'dist', 'critical.css');
    fs.writeFileSync(criticalPath, criticalCSS);
    
    // Write non-critical CSS
    const nonCriticalCSS = nonCriticalRoot.toString();
    const nonCriticalPath = path.join(__dirname, '..', 'dist', 'non-critical.css');
    fs.writeFileSync(nonCriticalPath, nonCriticalCSS);
    
    // Minify critical CSS
    const minifiedCritical = await postcss([
      require('cssnano')({
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true
        }]
      })
    ]).process(criticalCSS, { from: undefined });
    
    const criticalMinPath = path.join(__dirname, '..', 'dist', 'critical.min.css');
    fs.writeFileSync(criticalMinPath, minifiedCritical.css);
    
    // Generate CDN versions
    const cdnDir = path.join(__dirname, '..', 'dist', 'cdn');
    if (!fs.existsSync(cdnDir)) {
      fs.mkdirSync(cdnDir, { recursive: true });
    }
    
    const header = `/*! TicketIQ Design System Critical CSS v${require('../package.json').version} | MIT License */\n`;
    fs.writeFileSync(
      path.join(cdnDir, 'ticketiq-critical.css'),
      header + criticalCSS
    );
    fs.writeFileSync(
      path.join(cdnDir, 'ticketiq-critical.min.css'),
      header + minifiedCritical.css
    );
    
    // Generate loading script for non-critical CSS
    generateLazyLoadScript();
    
    // Print summary
    const criticalSize = (fs.statSync(criticalPath).size / 1024).toFixed(2);
    const nonCriticalSize = (fs.statSync(nonCriticalPath).size / 1024).toFixed(2);
    const criticalMinSize = (fs.statSync(criticalMinPath).size / 1024).toFixed(2);
    
    console.log('✅ Critical CSS extraction completed!');
    console.log(`📊 Critical CSS: ${criticalSize} KB (${criticalMinSize} KB minified)`);
    console.log(`📊 Non-critical CSS: ${nonCriticalSize} KB`);
    console.log(`📁 Files generated:`);
    console.log(`   - dist/critical.css`);
    console.log(`   - dist/critical.min.css`);
    console.log(`   - dist/non-critical.css`);
    console.log(`   - dist/cdn/ticketiq-critical.css`);
    console.log(`   - dist/cdn/ticketiq-critical.min.css`);
    console.log(`   - dist/lazy-load.js`);
    
  } catch (error) {
    console.error('❌ Critical CSS extraction failed:', error.message);
    process.exit(1);
  }
}

function generateLazyLoadScript() {
  const lazyLoadScript = `/**
 * TicketIQ Design System - Lazy CSS Loader
 * Loads non-critical CSS after page load to improve performance
 */

(function() {
  'use strict';
  
  // Check if non-critical CSS is already loaded
  if (document.querySelector('link[data-ticketiq-non-critical]')) {
    return;
  }
  
  function loadNonCriticalCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'non-critical.css';
    link.setAttribute('data-ticketiq-non-critical', 'true');
    link.media = 'print';
    link.onload = function() {
      this.media = 'all';
    };
    
    // Fallback for browsers that don't support onload
    setTimeout(function() {
      link.media = 'all';
    }, 3000);
    
    document.head.appendChild(link);
  }
  
  // Load non-critical CSS after page load
  if (document.readyState === 'complete') {
    loadNonCriticalCSS();
  } else {
    window.addEventListener('load', loadNonCriticalCSS);
  }
  
  // Preload for better performance
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'style';
  preloadLink.href = 'non-critical.css';
  document.head.appendChild(preloadLink);
})();`;

  const scriptPath = path.join(__dirname, '..', 'dist', 'lazy-load.js');
  fs.writeFileSync(scriptPath, lazyLoadScript);
  
  // Create minified version
  const minifiedScript = lazyLoadScript
    .replace(/\/\*\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/;\s*}/g, ';}') // Remove spaces before closing braces
    .trim();
  
  const scriptMinPath = path.join(__dirname, '..', 'dist', 'lazy-load.min.js');
  fs.writeFileSync(scriptMinPath, minifiedScript);
  
  // CDN versions
  const cdnDir = path.join(__dirname, '..', 'dist', 'cdn');
  const header = `/*! TicketIQ Design System Lazy Loader v${require('../package.json').version} | MIT License */\n`;
  
  fs.writeFileSync(
    path.join(cdnDir, 'ticketiq-lazy-load.js'),
    header + lazyLoadScript
  );
  fs.writeFileSync(
    path.join(cdnDir, 'ticketiq-lazy-load.min.js'),
    header + minifiedScript
  );
}

// Run the extraction
extractCriticalCSS();