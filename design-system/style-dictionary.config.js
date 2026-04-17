const StyleDictionary = require('style-dictionary');
const fs = require('fs');
const path = require('path');

// Ensure CDN directory exists
const cdnDir = path.join(__dirname, 'dist', 'cdn');
if (!fs.existsSync(cdnDir)) {
  fs.mkdirSync(cdnDir, { recursive: true });
}

// Custom transforms
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: function(token) {
    return token.attributes.category === 'size' || 
           token.attributes.category === 'spacing' ||
           token.attributes.category === 'borderRadius';
  },
  transformer: function(token) {
    return parseFloat(token.original.value) + 'px';
  }
});

StyleDictionary.registerTransform({
  name: 'color/css',
  type: 'value',
  matcher: function(token) {
    return token.attributes.category === 'color';
  },
  transformer: function(token) {
    return token.original.value;
  }
});

// Custom formats
StyleDictionary.registerFormat({
  name: 'css/variables',
  formatter: function(dictionary) {
    return `:root {\n${dictionary.allTokens.map(token => 
      `  --${token.name}: ${token.value};`
    ).join('\n')}\n}`;
  }
});

StyleDictionary.registerFormat({
  name: 'css/variables-cdn',
  formatter: function(dictionary) {
    const header = `/*! TicketIQ Design System v${require('./package.json').version} | MIT License */\n`;
    return header + `:root {\n${dictionary.allTokens.map(token => 
      `  --${token.name}: ${token.value};`
    ).join('\n')}\n}`;
  }
});

StyleDictionary.registerFormat({
  name: 'javascript/es6',
  formatter: function(dictionary) {
    const tokens = {};
    dictionary.allTokens.forEach(token => {
      const path = token.path;
      let current = tokens;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = token.value;
    });
    
    return `export const tokens = ${JSON.stringify(tokens, null, 2)};`;
  }
});

StyleDictionary.registerFormat({
  name: 'javascript/umd',
  formatter: function(dictionary) {
    const tokens = {};
    dictionary.allTokens.forEach(token => {
      const path = token.path;
      let current = tokens;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = token.value;
    });
    
    const header = `/*! TicketIQ Design System v${require('./package.json').version} | MIT License */\n`;
    return header + `(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TicketIQDesignSystem = {}));
}(this, (function (exports) { 'use strict';
  
  var tokens = ${JSON.stringify(tokens, null, 2)};
  
  exports.tokens = tokens;
  
  Object.defineProperty(exports, '__esModule', { value: true });
  
})));`;
  }
});

StyleDictionary.registerFormat({
  name: 'typescript/es6-declarations',
  formatter: function(dictionary) {
    const generateInterface = (obj, name = 'Tokens') => {
      let result = `export interface ${name} {\n`;
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const interfaceName = key.charAt(0).toUpperCase() + key.slice(1);
          // Handle numeric keys by wrapping in quotes
          const keyName = /^\d/.test(key) ? `'${key}'` : key;
          result += `  ${keyName}: ${interfaceName};\n`;
        } else {
          // Handle numeric keys by wrapping in quotes
          const keyName = /^\d/.test(key) ? `'${key}'` : key;
          result += `  ${keyName}: string;\n`;
        }
      }
      
      result += '}\n\n';
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const interfaceName = key.charAt(0).toUpperCase() + key.slice(1);
          result += generateInterface(value, interfaceName);
        }
      }
      
      return result;
    };
    
    const tokens = {};
    dictionary.allTokens.forEach(token => {
      const path = token.path;
      let current = tokens;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = 'string';
    });
    
    return generateInterface(tokens);
  }
});

// Base configuration for all tokens (excluding themes)
const baseConfig = {
  source: ['tokens/global.json', 'tokens/semantic.json', 'tokens/components.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables'
        }
      ]
    },
    'css-cdn': {
      transformGroup: 'css',
      buildPath: 'dist/cdn/',
      files: [
        {
          destination: 'ticketiq-design-tokens.css',
          format: 'css/variables-cdn'
        }
      ]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6'
        }
      ]
    },
    'js-cdn': {
      transformGroup: 'js',
      buildPath: 'dist/cdn/',
      files: [
        {
          destination: 'ticketiq-design-tokens.umd.js',
          format: 'javascript/umd'
        }
      ]
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'dist/ts/',
      files: [
        {
          destination: 'tokens.d.ts',
          format: 'typescript/es6-declarations'
        }
      ]
    },
    json: {
      transformGroup: 'js',
      buildPath: 'dist/json/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested'
        }
      ]
    }
  }
};

// Dark theme configuration
const darkConfig = {
  source: ['tokens/global.json', 'tokens/semantic.json', 'tokens/components.json', 'tokens/themes/dark.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'dark-theme.css',
          format: 'css/variables'
        }
      ]
    },
    'css-cdn': {
      transformGroup: 'css',
      buildPath: 'dist/cdn/',
      files: [
        {
          destination: 'ticketiq-design-tokens-dark.css',
          format: 'css/variables-cdn'
        }
      ]
    }
  }
};

// Light theme configuration
const lightConfig = {
  source: ['tokens/global.json', 'tokens/semantic.json', 'tokens/components.json', 'tokens/themes/light.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'light-theme.css',
          format: 'css/variables'
        }
      ]
    },
    'css-cdn': {
      transformGroup: 'css',
      buildPath: 'dist/cdn/',
      files: [
        {
          destination: 'ticketiq-design-tokens-light.css',
          format: 'css/variables-cdn'
        }
      ]
    }
  }
};

module.exports = [baseConfig, darkConfig, lightConfig];