// Mock for CSS imports in Jest tests
// This mock loads the actual CSS variables for testing

const fs = require('fs');
const path = require('path');

// Load the actual CSS variables for testing
try {
  const cssPath = path.join(__dirname, '../../dist/css/variables.css');
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Create a style element and inject the CSS
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = cssContent;
      document.head.appendChild(style);
    }
  }
} catch (error) {
  // Fallback to empty object if CSS can't be loaded
  console.warn('Could not load CSS variables for tests:', error.message);
}

module.exports = {};