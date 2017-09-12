var
  config = require('../config'),
  theme = process.argv[2] || config.defaultTheme,
  server = process.argv[3] || config.defaultServer

module.exports = {
  dev: process.env.NODE_ENV === 'development',
  prod: process.env.NODE_ENV === 'production',
  server: server,
  platform: {
    theme: theme,
    cordovaAssets: './cordova/platforms/' + (theme === 'mat' ? 'android' : 'ios') + '/platform_www'
  }
}
