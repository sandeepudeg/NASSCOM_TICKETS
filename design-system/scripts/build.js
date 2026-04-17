#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building TicketIQ Design System...\n');

// Ensure directories exist
const dirs = [
  'dist',
  'dist/css',
  'dist/js',
  'dist/ts',
  'dist/json',
  'dist/cdn'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

try {
  // Step 1: Build design tokens
  console.log('🎨 Building design tokens...');
  execSync('npm run build:tokens', { stdio: 'inherit' });
  
  // Step 2: Build CSS
  console.log('💄 Building CSS...');
  execSync('npm run build:css', { stdio: 'inherit' });
  
  // Step 3: Build JavaScript
  console.log('📦 Building JavaScript modules...');
  execSync('npm run build:js', { stdio: 'inherit' });
  
  // Step 4: Build CDN assets
  console.log('🌐 Building CDN assets...');
  execSync('npm run build:cdn', { stdio: 'inherit' });
  
  // Step 5: Generate package info
  console.log('📋 Generating package information...');
  generatePackageInfo();
  
  console.log('\n✅ Build completed successfully!');
  console.log('\n📊 Build Summary:');
  printBuildSummary();
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

function generatePackageInfo() {
  const packageJson = require('../package.json');
  const buildInfo = {
    name: packageJson.name,
    version: packageJson.version,
    buildDate: new Date().toISOString(),
    files: {
      css: [
        'dist/css/variables.css',
        'dist/css/dark-theme.css',
        'dist/css/light-theme.css',
        'dist/styles.css',
        'dist/styles.min.css'
      ],
      js: [
        'dist/index.js',
        'dist/index.esm.js',
        'dist/js/tokens.js'
      ],
      types: [
        'dist/index.d.ts',
        'dist/ts/tokens.d.ts'
      ],
      cdn: [
        'dist/cdn/ticketiq-design-tokens.css',
        'dist/cdn/ticketiq-design-tokens-dark.css',
        'dist/cdn/ticketiq-design-tokens-light.css',
        'dist/cdn/ticketiq-design-tokens.umd.js',
        'dist/cdn/ticketiq-design-system.js',
        'dist/cdn/ticketiq-design-system.esm.js'
      ]
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'dist', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
}

function printBuildSummary() {
  const distPath = path.join(__dirname, '..', 'dist');
  
  function getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return (stats.size / 1024).toFixed(2) + ' KB';
    } catch {
      return 'N/A';
    }
  }
  
  const files = [
    { name: 'CSS Variables', path: 'dist/css/variables.css' },
    { name: 'Minified Styles', path: 'dist/styles.min.css' },
    { name: 'JS Tokens', path: 'dist/js/tokens.js' },
    { name: 'Main Bundle (CJS)', path: 'dist/index.js' },
    { name: 'Main Bundle (ESM)', path: 'dist/index.esm.js' },
    { name: 'CDN Bundle (UMD)', path: 'dist/cdn/ticketiq-design-tokens.umd.js' }
  ];
  
  files.forEach(file => {
    const fullPath = path.join(__dirname, '..', file.path);
    const size = getFileSize(fullPath);
    console.log(`  ${file.name}: ${size}`);
  });
}