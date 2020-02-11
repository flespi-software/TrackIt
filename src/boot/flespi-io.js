import VueConnection from 'flespi-io-js/dist/vue-plugin'
import { version } from '../../package.json'

let rest = '',
  socket = ''
/* if local dev build */
if (DEV) {
  if (window.location.host.indexOf('localhost') !== -1) {
    rest = 'https://localhost:9005'
    socket = 'wss://localhost:9017'
  }
} else if (PROD) {
  if (window.location.host.indexOf('flespi.io') === -1) {
    rest = `https://${window.location.hostname}:9005`
    socket = `wss://${window.location.hostname}:9017`
  } else if (window.location.pathname.indexOf('/trackit') !== -1) {
    rest = `https://${window.location.host}`
    socket = `wss://${window.location.host}`
  }
}

let isDev = DEV || (PROD && window.location.host.indexOf('flespi.io') === -1)
let mqttSettings = { protocolVersion: 5, wsOptions: { objectMode: false, perMessageDeflate: true } }
let connectionConfig = {
  socketConfig: {
    server: socket,
    clientId: `trackit-${version}${isDev ? '-dev' : ''}-${Math.random().toString(16).substr(2, 8)}`,
    mqttSettings
  },
  httpConfig: rest ? { server: rest } : undefined
}

export default ({ Vue, store }) => {
  Vue.prototype.$authHost = rest || 'https://flespi.io'
  Vue.prototype.$flespiServer = rest || 'https://flespi.io'
  Vue.use(VueConnection, connectionConfig)
  Vue.connector.socket.on('error', (error) => {
    store.commit('reqFailed', error)
  })
  if (window) {
    window.addEventListener('beforeunload', () => {
      Vue.connector.socket.close(true)
    })
  }
}
