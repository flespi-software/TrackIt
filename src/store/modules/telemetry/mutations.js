import Vue from 'vue'

function init (state, device) {
  Vue.set(state, 'deviceId', device.id || -1)
  Vue.set(state, 'telemetry', device.telemetry || {})
}

function setTelemetry (state, payload) {
  Object.keys(payload.telemetry).forEach(key => {
    if (!state.telemetry[key] || (state.telemetry[key] && state.telemetry[key].ts !== payload.telemetry[key].ts)) {
      Vue.set(state.telemetry, key, payload.telemetry[key])
    }
  })
}
function reqStart (state) {
  if (DEV) {
    console.log('Start Request Telemetry')
  }
}
function clear (state) {
  Vue.set(state, 'telemetry', {})
  Vue.set(state, 'deviceId', null)
}

export default {
  init,
  setTelemetry,
  reqStart,
  clear
}
