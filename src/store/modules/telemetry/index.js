import actions from './actions'
import mutations from './mutations'

const state = {
  deviceId: null,
  telemetry: {}
}

export default {
  namespaced: true,
  state,
  actions,
  mutations
}
