import ConnectionPlugin from 'flespi-io-js/dist/vue3-plugin'
import packagejson from '../../package.json'
import { boot } from 'quasar/wrappers'
import axios from 'axios'

async function getRegion() {
  const host =
    window.location.hostname.indexOf('flespi.io') > -1
      ? window.location.hostname
      : window.location.hostname + ':9005'
  let api
  try {
    api = await axios.get(`https://${host}/auth/regions`, {})
  } catch {
    api = await axios.get('https://flespi.io/auth/regions', {})
  }
  const list = []
  let region = ''
  const regions =
    api.data.result &&
    api.data.result.reduce((a, b) => {
      a[b.name || b.region] = b
      list.push({ label: b.name || b.region, value: b.name || b.region, sublabel: b.rest })
      if (b.default && !region) {
        region = b.name || b.region
      }
      return a
    }, {})
  if (!region) {
    region = list[0] && list[0].value
  }
  return regions[region]
}
// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
// const api = axios.create({ baseURL: 'https://api.example.com' })

export default boot(async ({ app, store }) => {
  const path = window.location.hash.split('/')
  let name = packagejson.name
  if (path[path.length - 1] === 'support') {
    name = 'support-' + name
  }
  const appident = `${name}-${packagejson.version}${window.location.hostname === 'localhost' ? 'test' : ''}-${Math.random().toString(16).substring(2, 10)}`
  const currentRegion = await getRegion()
  let connectionConfig = {
    httpConfig: { headers: { 'x-flespi-app': appident } },
    socketConfig: {
      clientId: app,
      mqttSettings: {
        protocolVersion: 5,
        clean: true,
        wsOptions: { objectMode: false, perMessageDeflate: true },
        resubscribe: false,
        keepalive: 240,
      },
    },
  }

  connectionConfig = {
    httpConfig: { server: currentRegion.rest, headers: { 'x-flespi-app': appident } },
    socketConfig: {
      server: `wss://${currentRegion['mqtt-ws']}`,
      clientId: appident,
      mqttSettings: {
        protocolVersion: 5,
        clean: true,
        wsOptions: { objectMode: false, perMessageDeflate: true },
        resubscribe: false,
        keepalive: 240,
      },
    },
  }
  // properties: { sessionExpiryInterval: 300 },

  app.config.globalProperties.$defaultRegion = currentRegion
  app.use(ConnectionPlugin, connectionConfig)
  store.use(() => ({ $connector: app.config.globalProperties.$connector, $region: currentRegion }))
  // Vue.connector.http.defaults.headers.common['x-flespi-front-app'] = `${name}-${packagejson.version}-${Math.random().toString(16).substring(2, 8)}`
  // console.log(Vue.connector)
  console.log(JSON.stringify(ConnectionPlugin), app)
  // app.config.globalProperties.$connector.http.update('config', { headers: { 'x-flespi-app': app } })
  // Vue.connector.http.external.interceptors.request.use(
  //   config => {
  //     config.headers['x-flespi-app'] = app
  //     return config
  //   },
  //   error => {
  //     return Promise.reject(error)
  //   }
  // )
  if (window) {
    window.addEventListener('beforeunload', () => {
      app.config.globalProperties.$connector.socket.close(true)
    })
  }

  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  // app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

// export { api }
