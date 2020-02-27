import Vuex from 'vuex'
import Vue from 'vue'

import actions from './actions'
import mutations from './mutations'
import getters from './getters'
import modules from './modules'

Vue.use(Vuex)

const state = {
  token: '',
  devices: [],
  activeDevicesID: [],
  hasDevicesInit: false,
  offline: false,
  socketOffline: false,
  isLoading: false,
  newNotificationCounter: 0,
  errors: [],
  regions: null,
  currentRegion: null
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
