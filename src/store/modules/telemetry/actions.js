import Vue from 'vue'

function update ({ state, commit, rootState }) {
  commit('reqStart')
  return rootState.token && state.deviceId ? Vue.http.get(`${Vue.config.flespiServer}/registry/devices/${state.deviceId}`, {
    params: {
      fields: 'telemetry'
    }
  }).then((resp) => resp.json())
    .then((json) => {
      commit('setTelemetry', json.result[0])
      return json.result[0]
    })
    .catch((err) => { commit('reqFailed', err, { root: true }) }) : false
}

export default {
  update
}
