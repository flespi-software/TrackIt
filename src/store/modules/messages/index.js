import actions from './actions'
import mutations from './mutations'

let state = {
  entities: {},
  timestamp: 0,
  activeDevicesID: []
}

export default {
  namespaced: true,
  state,
  actions,
  mutations
}
