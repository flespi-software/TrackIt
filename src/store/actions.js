import Vue from 'vue'

async function poolDevices ({ state, commit }) {
  commit('reqStart')
  try {
    if (state.token) {
      let ids = await Vue.connector.poolDevices((resp) => { commit('setDevices', resp) }, (type, device) => { commit('updateDevices', { type, device }) })
      return async () => { await Vue.connector.poolDevicesStop(ids) }
    }
  } catch (error) { commit('reqFailed', error) }
}

async function postMessage ({ state, commit }, { data, id }) {
  commit('reqStart')
  try {
    let postMessageResp = await Vue.connector.gw.postDevicesMessages(id, data)
    let postMessage = postMessageResp.data
    if (postMessage.errors) {
      postMessage.errors.forEach((error) => {
        commit('addError', error.reason)
      })
    }
    commit('reqSuccessful', {
      type: 'postMessage',
      payload: postMessage
    })
  } catch (error) { commit('reqFailed', error) }
}

async function checkConnection ({ state, commit }) {
  try {
    let resp = await Vue.connector.http.external.get(`./statics/icons/favicon-16x16.png?_=${(new Date()).getTime()}`)
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
  let items = selector || state.activeDevicesID.join(',')
  if (items) {
    let telemetryResp = await Vue.connector.gw.getDevicesTelemetry(items),
      telemetryRespData = telemetryResp.data
    if (telemetryRespData.errors) {
      postMessage.errors.forEach((error) => {
        commit('addError', error.reason)
      })
    }
    let now = Math.max(
      ...telemetryRespData.result.reduce((result, info) => {
        result.push(info.telemetry && info.telemetry['position.latitude'] ? Math.floor(info.telemetry['position.latitude'].ts * 1000) : 0)
        result.push(info.telemetry && info.telemetry['position.longitude'] ? Math.floor(info.telemetry['position.longitude'].ts * 1000) : 0)
        return result
      }, [])
    )
    return now - (now % 86400000)
  } else {
    return Date.now()
  }
}

async function getInitDataByDeviceId ({ commit, state }, id) {
  let telemetryResp = await Vue.connector.gw.getDevicesTelemetry(id),
    telemetryRespData = telemetryResp.data
  if (telemetryRespData.errors) {
    postMessage.errors.forEach((error) => {
      commit('addError', error.reason)
    })
  }
  let telemetry = telemetryRespData && telemetryRespData.result[0] && telemetryRespData.result[0].telemetry ? telemetryRespData.result[0].telemetry : {}
  let initMessage = Object.keys(telemetry).reduce((message, paramName) => {
    if (paramName === 'position') { return message }
    message[paramName] = telemetry[paramName].value
    return message
  }, {})
  initMessage['x-flespi-inited-by-telemetry'] = true
  commit(`messages/${id}/setMessages`, [initMessage])
}

export default {
  poolDevices,
  postMessage,
  checkConnection,
  getLastUpdatePosition,
  getInitDataByDeviceId
}
