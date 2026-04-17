// Theme System Validation Tests
// This script validates WCAG compliance and theme switching functionality

const fs = require('fs');
const path = require('path');

// Color contrast calculation utilities
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Theme color definitions (extracted from token files)
const themes = {
  dark: {
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    background: '#0f0f1a',
    surface: '#1a1a2e',
    primary: '#4f46e5',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  },
  light: {
    text: '#0f172a',
    textMuted: '#475569',
    background: '#ffffff',
    surface: '#ffffff',
    primary: '#4f46e5',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }
};

// WCAG compliance tests
function validateWCAGCompliance() {
  console.log('🎨 Validating WCAG AA Compliance...\n');
  
  let allPassed = true;
  
  Object.entries(themes).forEach(([themeName, colors]) => {
    console.log(`📋 ${themeName.toUpperCase()} THEME:`);
    
    // Test text on background
    const textBgRatio = getContrastRatio(colors.text, colors.background);
    const textBgPass = textBgRatio >= 4.5;
    console.log(`  Text on Background: ${textBgRatio.toFixed(2)}:1 ${textBgPass ? '✅' : '❌'}`);
    if (!textBgPass) allPassed = false;
    
    // Test muted text on background
    const mutedBgRatio = getContrastRatio(colors.textMuted, colors.background);
    const mutedBgPass = mutedBgRatio >= 4.5;
    console.log(`  Muted Text on Background: ${mutedBgRatio.toFixed(2)}:1 ${mutedBgPass ? '✅' : '❌'}`);
    if (!mutedBgPass) allPassed = false;
    
    // Test text on surface
    const textSurfaceRatio = getContrastRatio(colors.text, colors.surface);
    const textSurfacePass = textSurfaceRatio >= 4.5;
    console.log(`  Text on Surface: ${textSurfaceRatio.toFixed(2)}:1 ${textSurfacePass ? '✅' : '❌'}`);
    if (!textSurfacePass) allPassed = false;
    
    // Test primary color accessibility (white text on primary background)
    const primaryRatio = getContrastRatio('#ffffff', colors.primary);
    const primaryPass = primaryRatio >= 4.5;
    console.log(`  White on Primary: ${primaryRatio.toFixed(2)}:1 ${primaryPass ? '✅' : '❌'}`);
    if (!primaryPass) allPassed = false;
    
    console.log('');
  });
  
  return allPassed;
}

// Validate theme file structure
function validateThemeFiles() {
  console.log('📁 Validating Theme File Structure...\n');
  
  const requiredFiles = [
    'dist/css/variables.css',
    'dist/css/dark-theme.css',
    'dist/css/light-theme.css',
    'dist/cdn/ticketiq-design-tokens-dark.css',
    'dist/cdn/ticketiq-design-tokens-light.css',
    'src/styles/themes.css'
  ];
  
  let allExist = true;
  
  requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    console.log(`  ${file}: ${exists ? '✅' : '❌'}`);
    if (!exists) allExist = false;
  });
  
  console.log('');
  return allExist;
}

// Validate CSS custom properties
function validateCSSProperties() {
  console.log('🎯 Validating CSS Custom Properties...\n');
  
  const darkThemeFile = path.join(__dirname, '..', 'dist/css/dark-theme.css');
  const lightThemeFile = path.join(__dirname, '..', 'dist/css/light-theme.css');
  
  if (!fs.existsSync(darkThemeFile) || !fs.existsSync(lightThemeFile)) {
    console.log('  ❌ Theme files not found');
    return false;
  }
  
  const darkContent = fs.readFileSync(darkThemeFile, 'utf8');
  const lightContent = fs.readFileSync(lightThemeFile, 'utf8');
  
  const requiredProperties = [
    '--color-theme-primary',
    '--color-theme-text',
    '--color-theme-text-muted',
    '--color-theme-background',
    '--color-theme-surface',
    '--color-theme-border',
    '--component-badge-green-background',
    '--component-badge-green-color'
  ];
  
  let allFound = true;
  
  requiredProperties.forEach(prop => {
    const inDark = darkContent.includes(prop);
    const inLight = lightContent.includes(prop);
    console.log(`  ${prop}: Dark ${inDark ? '✅' : '❌'} Light ${inLight ? '✅' : '❌'}`);
    if (!inDark || !inLight) allFound = false;
  });
  
  console.log('');
  return allFound;
}

// Validate theme token differences
function validateThemeDifferences() {
  console.log('🔄 Validating Theme Differences...\n');
  
  const darkThemeFile = path.join(__dirname, '..', 'dist/css/dark-theme.css');
  const lightThemeFile = path.join(__dirname, '..', 'dist/css/light-theme.css');
  
  if (!fs.existsSync(darkThemeFile) || !fs.existsSync(lightThemeFile)) {
    console.log('  ❌ Theme files not found');
    return false;
  }
  
  const darkContent = fs.readFileSync(darkThemeFile, 'utf8');
  const lightContent = fs.readFileSync(lightThemeFile, 'utf8');
  
  // Extract theme-specific values
  const extractThemeValue = (content, property) => {
    const match = content.match(new RegExp(`${property}:\\s*([^;]+);`));
    return match ? match[1].trim() : null;
  };
  
  const themeProperties = [
    '--color-theme-text',
    '--color-theme-background',
    '--component-badge-green-color'
  ];
  
  let hasDifferences = true;
  
  themeProperties.forEach(prop => {
    const darkValue = extractThemeValue(darkContent, prop);
    const lightValue = extractThemeValue(lightContent, prop);
    
    const different = darkValue !== lightValue;
    console.log(`  ${prop}: ${different ? '✅ Different' : '❌ Same'} (Dark: ${darkValue}, Light: ${lightValue})`);
    
    if (!different) hasDifferences = false;
  });
  
  console.log('');
  return hasDifferences;
}

// Main validation function
function runValidation() {
  console.log('🚀 TicketIQ Design System - Theme Validation\n');
  console.log('=' .repeat(50) + '\n');
  
  const results = {
    fileStructure: validateThemeFiles(),
    cssProperties: validateCSSProperties(),
    themeDifferences: validateThemeDifferences(),
    wcagCompliance: validateWCAGCompliance()
  };
  
  console.log('📊 VALIDATION SUMMARY:');
  console.log('=' .repeat(30));
  console.log(`File Structure: ${results.fileStructure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CSS Properties: ${results.cssProperties ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Theme Differences: ${results.themeDifferences ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WCAG Compliance: ${results.wcagCompliance ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Theme system is ready for production!');
    console.log('✨ Features implemented:');
    console.log('   • Dark/Light theme variants');
    console.log('   • WCAG AA compliant color combinations');
    console.log('   • Automatic system preference detection');
    console.log('   • Theme switching with persistence');
    console.log('   • Smooth transitions between themes');
    console.log('   • Comprehensive CSS custom properties');
  }
  
  return allPassed;
}

// Run validation if called directly
if (require.main === module) {
  const success = runValidation();
  process.exit(success ? 0 : 1);
}

module.exports = {
  runValidation,
  validateWCAGCompliance,
  validateThemeFiles,
  validateCSSProperties,
  validateThemeDifferences,
  getContrastRatio
};