// webpack.config.js - Tree-shaking configuration
module.exports = {
  mode: 'production',
  optimization: {
    usedExports: true,
    sideEffects: false, // Enable tree-shaking
  },
  resolve: {
    alias: {
      // Alias for easier imports
      '@ticketiq/design-system': '@ticketiq/design-system/modular'
    }
  }
};