import Vuex from 'vuex'
import Vue from 'vue'

import actions from './actions'
import mutations from './mutations'
import getters from './getters'
import modules from './modules'

Vue.use(Vuex)

let state = {
  providers: {},
  token: '',
  devices: [],
  activeDevicesID: [],
  hasDevicesInit: false,
  offline: false,
  socketOffline: false,
  isLoading: false,
  newNotificationCounter: 0,
  errors: []
}

const store = new Vuex.Store(
  {
    state,
    actions,
    mutations,
    getters,
    modules
  }
)

export default store
