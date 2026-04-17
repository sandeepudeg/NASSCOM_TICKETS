module.exports = {
  plugins: [
    require('postcss-import'),
    require('autoprefixer')({
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11'
      ]
    })
  ]
};