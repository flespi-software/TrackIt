import Vue from 'vue'
import get from 'lodash/get'
async function poolDevices ({ state, commit }) {
  commit('reqStart')
  try {
    if (state.token) {
      const ids = await Vue.connector.poolDevices((resp) => { commit('setDevices', resp) }, (type, device) => { commit('updateDevices', { type, device }) })
      return async () => { await Vue.connector.poolDevicesStop(ids) }
    }
  } catch (error) { commit('reqFailed', error) }
}

async function checkConnection ({ state, commit }) {
  try {
    const resp = await Vue.connector.http.external.get(`./icons/favicon-16x16.png?_=${(new Date()).getTime()}`)
    if (resp.status === 200 && state.offline) {
      commit('setOfflineFlag', false)
    }
  } catch (e) {
    if (DEV) {
      console.log(e)
    }
    if (!state.offline) {
      commit('setOfflineFlag', true)
    }
  }
}

async function getLastUpdatePosition ({ commit, state }, selector) {
  let from = new Date().setHours(0, 0, 0, 0),
    to = from + 86399999.999
  if (state.token) {
    const items = selector || state.activeDevicesID.join(',')
    let initTime
    if (items) {
      const telemetryResp = await Vue.connector.gw.getDevicesTelemetry(items, 'position.latitude,position.longitude'),
        telemetryRespData = telemetryResp.data
      if (telemetryRespData.errors) {
        postMessage.errors.forEach((error) => {
          commit('addError', error.reason)
        })
      }
      const now = Math.max(
        ...telemetryRespData.result.reduce((result, info) => {
          result.push(info.telemetry && info.telemetry['position.latitude'] ? Math.floor(info.telemetry['position.latitude'].ts * 1000) : 0)
          result.push(info.telemetry && info.telemetry['position.longitude'] ? Math.floor(info.telemetry['position.longitude'].ts * 1000) : 0)
          return result
        }, [])
      )
      initTime = now || Date.now()
    } else {
      initTime = Date.now()
    }
    from = new Date(initTime).setHours(0, 0, 0, 0)
    to = from + 86399999.999
  }
  return [from, to]
}

async function getInitDataByDeviceId ({ commit, state }, id) {
  if (!state.token) { return }
  const telemetryResp = await Vue.connector.gw.getDevicesTelemetry(id, 'all'),
    telemetryRespData = telemetryResp.data
  if (telemetryRespData.errors) {
    postMessage.errors.forEach((error) => {
      commit('addError', error.reason)
    })
  }
  const telemetry = telemetryRespData && telemetryRespData.result[0] && telemetryRespData.result[0].telemetry ? telemetryRespData.result[0].telemetry : {},
    telemetryFields = Object.keys(telemetry)
  if (!telemetryFields.length) {
    return false
  }
  const initMessage = telemetryFields.reduce((message, paramName) => {
    if (paramName === 'position') { return message }
    message[paramName] = telemetry[paramName].value
    return message
  }, {})
  Object.defineProperty(initMessage, 'x-flespi-inited-by-telemetry', {
    value: true,
    enumerable: false
  })
  commit(`messages/${id}/setHistoryMessages`, [initMessage])
}

async function getRegions ({ state, commit }) {
  try {
    if (typeof state.isLoading !== 'undefined') {
      Vue.set(state, 'isLoading', true)
    }
    const resp = await Vue.connector.http.get('/auth/regions')
    let regions = get(resp, 'data.result', [])
    let currentRegion = null
    regions = regions.reduce((regions, region) => {
      if (region.default) {
        currentRegion = region
      }
      regions[region.name] = region
      return regions
    }, {})
    currentRegion && commit('setCurrentRegion', currentRegion)
    commit('setRegions', regions)
  } catch (e) {
    commit('reqFailed', e)
    if (typeof state.isLoading !== 'undefined') {
      Vue.set(state, 'isLoading', false)
    }
  }
}

async function initConnection ({ state, commit }, { region, token }) {
  try {
    if (typeof state.isLoading !== 'undefined') {
      Vue.set(state, 'isLoading', true)
    }
    if (!state.regions) {
      await getRegions({ state, commit })
    }
    if (region) {
      commit('setCurrentRegion', state.regions[region])
    }
    Vue.prototype.$flespiServer = state.currentRegion.rest
    Vue.prototype.$flespiSocketServer = `wss://${state.currentRegion['mqtt-ws']}`
    Vue.prototype.$flespiCDN = state.currentRegion.cdn
    Vue.connector.setRegion(state.currentRegion)
    commit('setToken', token)
  } catch (e) {
    commit('reqFailed', e)
    if (typeof state.isLoading !== 'undefined') {
      Vue.set(state, 'isLoading', false)
    }
  }
}

export default {
  poolDevices,
  checkConnection,
  getLastUpdatePosition,
  getInitDataByDeviceId,
  getRegions,
  initConnection
}
