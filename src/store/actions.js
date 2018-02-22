import Vue from 'vue'

async function poolDevices ({ state, commit }) {
  commit('reqStart')
  try {
    if (state.token) {
      let ids = await Vue.connector.poolDevices((resp) => { commit('setDevices', resp) }, (type, device) => { commit('updateDevices', { type, device }) })
      return async () => { await Vue.connector.poolDevicesStop(ids) }
    }
  }
  catch (error) { commit('reqFailed', error) }
}

async function postMessage ({ state, commit }, { data, id }) {
  commit('reqStart')
  try {
    let postMessageResp = await Vue.connector.gw.postDevicesMessages(id, data)
    let postMessage = postMessageResp.data
    commit('reqSuccessful', {
      type: 'postMessage',
      payload: postMessage
    })
  }
  catch (error) { commit('reqFailed', error) }
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
  poolDevices,
  postMessage,
  checkConnection
}
