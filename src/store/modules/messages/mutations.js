import Vue from 'vue'

function reqStart (state) {
  if (DEV) {
    console.log('Start Request Messages')
  }
}

function reqSuccessful (state, payload) {
  let { result } = payload
  state.activeDevicesID.forEach(deviceID => {
    let newMessages = result.filter(message => message.device_id === deviceID)
    if (!newMessages.length) {
      if (!state.entities[deviceID]) {
        Vue.set(state.entities, deviceID, [])
      }
      return false
    }
    let currentMessages = state.entities[deviceID] || []
    Vue.set(state.entities, deviceID, [...newMessages, ...currentMessages].slice(0, 10))
  })
  Vue.set(state, 'timestamp', parseInt(state.activeDevicesID.reduce((res, deviceID) => state.entities[deviceID].length && state.entities[deviceID][0].timestamp > res ? state.entities[deviceID][0].timestamp : res, 0)))
}

function clear (state) {
  if (state.activeDevicesID.length) {
    Vue.set(state, 'entities', {})
    Vue.set(state, 'activeDevicesID', [])
    Vue.set(state, 'timestamp', 0)
  }
}

function clearByID (state, id) {
  Vue.delete(state.entities, id)
}

function setActiveDevicesID (state, ids) {
  Vue.set(state, 'activeDevicesID', ids)
}

export default {
  reqStart,
  reqSuccessful,
  clear,
  clearByID,
  setActiveDevicesID
}
