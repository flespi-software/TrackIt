import Vue from 'vue'
import { LocalStorage } from 'quasar-framework'

function getDevices ({ state, commit }) {
  commit('reqStart')
  return state.token ? Vue.http.get(`${Vue.config.flespiServer}/registry/devices/all`, {
    params: {
      fields: 'id,name,ident,phone,telemetry,messages_ttl'
    }
  }).then((resp) => resp.json())
    .then((json) => {
      commit('reqSuccessful', {
        type: 'devices',
        payload: json
      })
      if (!state.hasDevicesInit) {
        commit('setDevicesInit')
        let activeDevicesFromLocalStorage = LocalStorage.get.item('TrackIt Active Devices')
        if (activeDevicesFromLocalStorage && activeDevicesFromLocalStorage.length) {
          activeDevicesFromLocalStorage.forEach(id => {
            if (json.result.filter(device => device.id === id).length) {
              commit('setActiveDevice', id)
            }
          })
        }
      }
      return json.result
    })
    .catch((err) => { commit('reqFailed', err) }) : false
}

function postMessage ({ state, commit }, { data, id }) {
  commit('reqStart')
  return Vue.http.post(`${Vue.config.flespiServer}/registry/devices/${id}/messages`, data)
    .then(resp => resp.json())
    .then(json => {
      commit('reqSuccessful', {
        type: 'postMessage',
        payload: json
      })
    })
    .catch((err) => { commit('reqFailed', err) })
}

export default {
  getDevices,
  postMessage
}
