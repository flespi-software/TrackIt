import Vue from 'vue'
import { LocalStorage } from 'quasar-framework'

async function getDevices ({ state, commit }) {
  commit('reqStart')
  try {
    if (state.token) {
      let devicesResp = await Vue.connector.getDevices(`all`, { fields: 'id,name,ident,phone,telemetry,messages_ttl' })
      let devices = devicesResp.data
      commit('reqSuccessful', {
        type: 'devices',
        payload: devices
      })
      if (!state.hasDevicesInit) {
        commit('setDevicesInit')
        let activeDevicesFromLocalStorage = LocalStorage.get.item('TrackIt Active Devices')
        if (activeDevicesFromLocalStorage && activeDevicesFromLocalStorage.length) {
          activeDevicesFromLocalStorage.forEach(id => {
            if (devices.result.filter(device => device.id === id).length) {
              commit('setActiveDevice', id)
            }
          })
        }
      }
      return devices.result
    }
  }
  catch (error) { commit('reqFailed', error) }
}

async function subscribeDevices ({ state, commit }) {
  await Vue.connector.subscribeLogs('registry', 'devices/+', '#', (log) => { commit('updateDevices', log) })
}

async function postMessage ({ state, commit }, { data, id }) {
  commit('reqStart')
  try {
    let postMessageResp = await Vue.connector.postDevicesMessages(id, data)
    let postMessage = postMessageResp.data
    commit('reqSuccessful', {
      type: 'postMessage',
      payload: postMessage
    })
  }
  catch (error) { commit('reqFailed', error) }
}

async function unsubscribeDevices ({ state, commit }) {
  await Vue.connector.unsubscribeLogs('registry', 'devices/+', '#')
}

function checkConnection ({ state, commit }) {
  Vue.connector.http.get(`/statics/icons/favicon-16x16.png?_=${(new Date()).getTime()}`)
    .then(resp => {
      if (resp.status === 200) {
        commit('setOfflineFlag', false)
      }
    })
    .catch(err => {
      console.log(err)
    })
}

export default {
  getDevices,
  postMessage,
  checkConnection,
  subscribeDevices,
  unsubscribeDevices
}
