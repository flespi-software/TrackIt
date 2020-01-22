let buildMode = process.argv[2] || 'build',
  flespiServer = process.argv[3] || 'flespi'

let shell = require('shelljs')

process.env.FLESPI_SERVER = flespiServer
process.env.NODE_ENV = buildMode.indexOf('build') !== -1 ? 'production' : 'development'

console.log('FLESPI_MODE is ' + flespiServer)

shell.exec('quasar ' + buildMode)
