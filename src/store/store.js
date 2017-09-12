import Vuex from 'vuex'
import Vue from 'vue'
import VueResource from 'vue-resource'

Vue.use(VueResource)

import actions from './actions'
import mutations from './mutations'
import getters from './getters'
import modules from './modules'

Vue.use(Vuex)

let state = {
  token: '',
  devices: [],
  activeDevicesID: [],
  hasDevicesInit: false
}

export default new Vuex.Store(
  {
    state,
    actions,
    mutations,
    getters,
    modules
  }
)
