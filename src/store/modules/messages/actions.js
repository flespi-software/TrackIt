import Vue from 'vue'

function getHistoryByDeviceID ({ state, commit, rootState }, ids) {
  commit('reqStart')
  let data = {
    count: 10,
    reverse: true,
    filter: 'position.latitude,position.longitude',
    to: state.timestamp || 0
  }
  ids.forEach((id) => {
    if (!state.entities[id]) {
      Vue.set(state.entities, id, [])
    }
  })
  try {
    if (rootState.token) {
      ids.forEach(async (id) => {
        let devicesMessagesResp = await Vue.connector.registry.getDevicesMessages(id, {
          data: JSON.stringify(data)
        })
        let devicesMessages = devicesMessagesResp.data
        commit('reqSuccessful', devicesMessages)
      })
    }
  }
  catch (error) { commit('reqFailed', error, { root: true }) }
}

export default {
  getHistoryByDeviceID
}
