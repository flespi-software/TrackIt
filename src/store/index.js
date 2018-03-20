import Vuex from 'vuex'
import Vue from 'vue'

import actions from './actions'
import mutations from './mutations'
import getters from './getters'
import modules from './modules'

Vue.use(Vuex)

let state = {
  token: '',
  devices: [],
  activeDevicesID: [],
  hasDevicesInit: false,
  offline: false
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
