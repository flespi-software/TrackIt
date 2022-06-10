/* eslint-disable */
import VueConnection from 'flespi-io-js/dist/vue-plugin'
import { version } from '../../package.json'

let rest = '',
  socket = ''
/* if local dev build */
if (DEV && LOCAL) {
  if (window.location.host.indexOf('localhost') !== -1) {
    rest = 'https://localhost:9005'
    socket = 'wss://localhost:9017'
  }
} else if (PROD) {
  if (window.location.pathname.indexOf('/trackit') !== -1) {
    rest = `https://${window.location.host}`
    socket = `wss://${window.location.host}`
  }
}

const mqttSettings = { protocolVersion: 5, wsOptions: { objectMode: false, perMessageDeflate: true } }
const connectionConfig = {
  socketConfig: {
    server: socket,
    clientId: `trackit-${version}${DEV ? '-dev' : ''}-${Math.random().toString(16).substr(2, 8)}`,
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
