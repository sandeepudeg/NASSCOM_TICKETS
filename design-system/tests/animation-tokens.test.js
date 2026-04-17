/**
 * Animation Tokens Test
 * Simple test to verify animation tokens are properly generated
 */

describe('Animation Tokens', () => {
  test('should have animation duration tokens defined', () => {
    // Test that the tokens exist in the generated CSS
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../dist/css/variables.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for transition duration tokens
    expect(cssContent).toContain('--transition-duration-fast: 150ms');
    expect(cssContent).toContain('--transition-duration-normal: 250ms');
    expect(cssContent).toContain('--transition-duration-slow: 400ms');
    expect(cssContent).toContain('--transition-duration-slower: 600ms');
  });

  test('should have animation easing tokens defined', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../dist/css/variables.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for easing tokens
    expect(cssContent).toContain('--transition-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1)');
    expect(cssContent).toContain('--transition-easing-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)');
    expect(cssContent).toContain('--transition-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)');
  });

  test('should have animation duration tokens defined', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../dist/css/variables.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for animation duration tokens
    expect(cssContent).toContain('--animation-duration-fast: 200ms');
    expect(cssContent).toContain('--animation-duration-normal: 300ms');
    expect(cssContent).toContain('--animation-duration-slow: 500ms');
    expect(cssContent).toContain('--animation-duration-loading: 1.5s');
    expect(cssContent).toContain('--animation-duration-pulse: 2s');
  });

  test('should have animation delay tokens defined', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../dist/css/variables.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for animation delay tokens
    expect(cssContent).toContain('--animation-delay-none: 0ms');
    expect(cssContent).toContain('--animation-delay-short: 100ms');
    expect(cssContent).toContain('--animation-delay-medium: 200ms');
    expect(cssContent).toContain('--animation-delay-long: 300ms');
  });

  test('should have animation iteration tokens defined', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../dist/css/variables.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for animation iteration tokens
    expect(cssContent).toContain('--animation-iteration-once: 1');
    expect(cssContent).toContain('--animation-iteration-twice: 2');
    expect(cssContent).toContain('--animation-iteration-infinite: infinite');
  });
});

describe('Animation CSS Classes', () => {
  test('should have animation CSS file with keyframes', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../src/styles/animations.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for keyframe animations
    expect(cssContent).toContain('@keyframes spin');
    expect(cssContent).toContain('@keyframes pulse');
    expect(cssContent).toContain('@keyframes fadeIn');
    expect(cssContent).toContain('@keyframes slideInUp');
    expect(cssContent).toContain('@keyframes scaleIn');
  });

  test('should have utility classes for animations', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../src/styles/animations.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for utility classes
    expect(cssContent).toContain('.animate-spin');
    expect(cssContent).toContain('.animate-pulse');
    expect(cssContent).toContain('.animate-fadeIn');
    expect(cssContent).toContain('.hover-lift');
    expect(cssContent).toContain('.focus-ring');
  });

  test('should have reduced motion support', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../src/styles/animations.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for reduced motion media query
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssContent).toContain('animation-duration: 0.01ms !important');
    expect(cssContent).toContain('transition-duration: 0.01ms !important');
  });

  test('should have performance optimizations', () => {
    const fs = require('fs');
    const path = require('path');
    
    const cssPath = path.join(__dirname, '../src/styles/animations.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Check for performance optimization classes
    expect(cssContent).toContain('.gpu-accelerated');
    expect(cssContent).toContain('transform: translateZ(0)');
    expect(cssContent).toContain('.will-animate');
    expect(cssContent).toContain('will-change: transform, opacity');
  });
});