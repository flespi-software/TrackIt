import { Cookies, Toast, LocalStorage } from 'quasar-framework'
import Vue from 'vue'

function reqStart (state) {
  if (DEV) {
    console.log('Start Request')
  }
}
function reqSuccessful (state, { type, payload }) {
  let { result } = payload
  switch (type) {
    case 'postMessage': {
      Toast.create.positive({
        html: `Post message to devices with IDs ${result} success`,
        icon: 'alarm_add',
        timeout: 2500,
        bgColor: 'white'
      })
      if (DEV) {
        console.log(`Post message to devices with IDs ${result} success`)
      }
      break
    }
    default: {
      Vue.set(state, type, result)
    }
  }
}
function reqFailed (state, payload) {
  if (DEV) {
    console.log('Failed Request')
    console.log(payload)
  }
  switch (payload.status) {
    case 401: {
      clearToken(state)
      break
    }
    default: {
      if (DEV) {
        console.log(`${payload.status} - ${payload.statusText}`)
      }
    }
  }
}
function setToken (state, val) {
  let token = val.replace('FlespiToken ', '')
  if (val && token.match(/^[a-z0-9]+$/i)) {
    Vue.http.headers.common['Authorization'] = `FlespiToken ${token}`
    LocalStorage.set('X-Flespi-Token', token)
  }
  else {
    token = ''
    clearToken(state)
  }
  Vue.set(state, 'token', token)
}
function clearToken (state) {
  let cookieToken = Cookies.get('X-Flespi-Token'),
    localStorageToken = LocalStorage.get.item('X-Flespi-Token')
  if (cookieToken && localStorageToken && cookieToken === localStorageToken) {
    Cookies.remove('X-Flespi-Token')
  }
  LocalStorage.remove('X-Flespi-Token')
  Vue.http.headers.common['Authorization'] = ''
  Vue.set(state, 'token', '')
}
function setActiveDevice (state, id) {
  if (!state.devices.filter(device => device.id === id)[0].messages_ttl) {
    return
  }
  state.activeDevicesID.push(id)
  LocalStorage.set('TrackIt Active Devices', state.activeDevicesID)
}
function unsetActiveDevice (state, id) {
  state.activeDevicesID = state.activeDevicesID.filter(currentId => currentId !== id)
  LocalStorage.set('TrackIt Active Devices', state.activeDevicesID)
}
function setDevicesInit (state) {
  state.hasDevicesInit = true
}
function unsetDevicesInit (state) {
  state.hasDevicesInit = false
  Vue.set(state, 'devices', [])
  Vue.set(state, 'activeDevicesID', [])
}
export default {
  reqStart,
  reqSuccessful,
  reqFailed,
  setToken,
  clearToken,
  setActiveDevice,
  unsetActiveDevice,
  setDevicesInit,
  unsetDevicesInit
}
