const StyleDictionary = require('style-dictionary');

module.exports = {
  source: ['tokens/global.json', 'tokens/semantic.json', 'tokens/themes/light.json', 'tokens/components.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'tokens-light.css',
        format: 'css/variables',
        options: {
          selector: '[data-theme="light"]'
        }
      }]
    }
  }
};