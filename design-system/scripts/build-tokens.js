#!/usr/bin/env node

const StyleDictionary = require('style-dictionary');
const configs = require('../style-dictionary.config.js');

console.log('🎨 Building design tokens with all platforms...\n');

try {
  // Handle both single config and array of configs
  const configArray = Array.isArray(configs) ? configs : [configs];
  
  configArray.forEach((config, index) => {
    console.log(`Building configuration ${index + 1}/${configArray.length}...`);
    
    // Extend Style Dictionary with our configuration
    const sd = StyleDictionary.extend(config);
    
    // Build all platforms for this configuration
    sd.buildAllPlatforms();
  });
  
  console.log('\n✅ All design token platforms built successfully!');
  
  // List generated files
  console.log('\n📁 Generated files:');
  const fs = require('fs');
  const path = require('path');
  
  function listFiles(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${file}/`);
        listFiles(filePath, prefix + '  ');
      } else {
        const size = (stat.size / 1024).toFixed(2);
        console.log(`${prefix}📄 ${file} (${size} KB)`);
      }
    });
  }
  
  listFiles('dist');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}