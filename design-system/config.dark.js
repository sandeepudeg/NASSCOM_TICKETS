const StyleDictionary = require('style-dictionary');

module.exports = {
  source: ['tokens/global.json', 'tokens/semantic.json', 'tokens/themes/dark.json', 'tokens/components.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'tokens-dark.css',
        format: 'css/variables',
        options: {
          selector: '[data-theme="dark"]'
        }
      }]
    }
  }
};