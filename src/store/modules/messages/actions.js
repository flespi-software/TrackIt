import Vue from 'vue'

function get ({ state, commit, rootState }) {
  commit('reqStart')
  let data = {
    count: 10,
    reverse: true,
    filter: 'position.latitude,position.longitude',
    from: state.timestamp + 1 || 0
  }
  return (rootState.token && state.activeDevicesID.length) ? Vue.http.get(`${Vue.config.flespiServer}/registry/devices/${state.activeDevicesID}/messages`, {
    params: {
      data: JSON.stringify(data)
    }
  })
    .then((resp) => resp.json())
    .then((json) => {
      commit('reqSuccessful', json)
    })
    .catch((err) => { commit('reqFailed', err, { root: true }) }) : false
}

function getHistoryByDeviceID ({ state, commit, rootState }, id) {
  commit('reqStart')
  let data = {
    count: 10,
    reverse: true,
    filter: 'position.latitude,position.longitude',
    to: state.timestamp || 0
  }
  if (!state.entities[id]) {
    Vue.set(state.entities, id, [])
  }
  return (rootState.token) ? Vue.http.get(`${Vue.config.flespiServer}/registry/devices/${id}/messages`, {
    params: {
      data: JSON.stringify(data)
    }
  })
    .then((resp) => resp.json())
    .then((json) => {
      commit('reqSuccessful', json)
    })
    .catch((err) => { commit('reqFailed', err) }) : false
}

export default {
  get,
  getHistoryByDeviceID
}
