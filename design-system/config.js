const StyleDictionary = require('style-dictionary');

// Custom transforms
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: function(token) {
    return token.attributes.category === 'size' || 
           token.attributes.category === 'spacing' ||
           (token.attributes.category === 'font' && token.attributes.type === 'size');
  },
  transformer: function(token) {
    return parseFloat(token.original.value) + 'px';
  }
});

StyleDictionary.registerTransform({
  name: 'shadow/css',
  type: 'value',
  matcher: function(token) {
    return token.attributes.category === 'shadow';
  },
  transformer: function(token) {
    return token.original.value;
  }
});

// Custom formats
StyleDictionary.registerFormat({
  name: 'css/variables',
  formatter: function(dictionary, config) {
    return `:root {\n${dictionary.allTokens.map(token => 
      `  --${token.name}: ${token.value};`
    ).join('\n')}\n}\n\n[data-theme="dark"] {\n${dictionary.allTokens.filter(token => 
      token.filePath.includes('dark.json')
    ).map(token => 
      `  --${token.name}: ${token.value};`
    ).join('\n')}\n}\n\n[data-theme="light"] {\n${dictionary.allTokens.filter(token => 
      token.filePath.includes('light.json')
    ).map(token => 
      `  --${token.name}: ${token.value};`
    ).join('\n')}\n}`;
  }
});

StyleDictionary.registerFormat({
  name: 'javascript/es6',
  formatter: function(dictionary, config) {
    const tokens = dictionary.allTokens.reduce((acc, token) => {
      const keys = token.path;
      let current = acc;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = token.value;
      return acc;
    }, {});
    
    return `export const tokens = ${JSON.stringify(tokens, null, 2)};
export default tokens;`;
  }
});

StyleDictionary.registerFormat({
  name: 'typescript/es6-declarations',
  formatter: function(dictionary, config) {
    const generateInterface = (obj, name = 'Tokens') => {
      let result = `interface ${name} {\n`;
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          result += `  ${key}: ${generateInterface(value, `${name}${key.charAt(0).toUpperCase() + key.slice(1)}`)}\n`;
        } else {
          result += `  ${key}: string;\n`;
        }
      }
      
      result += '}';
      return result;
    };
    
    const tokens = dictionary.allTokens.reduce((acc, token) => {
      const keys = token.path;
      let current = acc;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = 'string';
      return acc;
    }, {});
    
    return `${generateInterface(tokens)}

declare const tokens: Tokens;
export { tokens };
export default tokens;`;
  }
});

module.exports = {
  source: ['tokens/global.json', 'tokens/semantic.json', 'tokens/components.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables'
      }]
    },
    scss: {
      transformGroup: 'scss',
      buildPath: 'dist/scss/',
      files: [{
        destination: '_tokens.scss',
        format: 'scss/variables'
      }]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/es6'
      }]
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'dist/js/',
      files: [{
        destination: 'tokens.d.ts',
        format: 'typescript/es6-declarations'
      }]
    },
    json: {
      transformGroup: 'js',
      buildPath: 'dist/json/',
      files: [{
        destination: 'tokens.json',
        format: 'json/nested'
      }]
    }
  }
};