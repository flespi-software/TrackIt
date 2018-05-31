import { Cookies, Notify, LocalStorage } from 'quasar'
import Vue from 'vue'
import Router from '../router'

function reqStart (state) {
  if (DEV) {
    console.log('Start Request')
  }
}
function reqSuccessful (state, { type, payload }) {
  let { result } = payload
  switch (type) {
    case 'postMessage': {
      Notify.create({
        message: `Post message to devices with IDs ${result} success`,
        type: 'positive',
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
      /* if result has difference with state */
      if (JSON.stringify(state[type]) !== JSON.stringify(result)) {
        Vue.set(state, type, result)
      }
    }
  }
}
function setDevices (state, devices) {
  /* if result has difference with state */
  if (JSON.stringify(state.devices) !== JSON.stringify(devices.data.result)) {
    Vue.set(state, 'devices', devices.data.result)
  }
  if (!state.hasDevicesInit) {
    if (state.activeDevicesID.length) {
      state.activeDevicesID.forEach(id => {
        if (!devices.data.result.filter(device => device.id === id).length) {
          unsetActiveDevice(state, id)
        }
      })
      setDevicesInit(state)
    } else {
      setDevicesInit(state)
      let activeDevicesFromLocalStorage = LocalStorage.get.item('TrackIt Active Devices')
      if (activeDevicesFromLocalStorage && activeDevicesFromLocalStorage.length) {
        activeDevicesFromLocalStorage.forEach(id => {
          if (devices.data.result.filter(device => device.id === id).length) {
            setActiveDevice(state, id)
          }
        })
      }
    }
  }
}
function updateDevices (state, payload) {
  switch (payload.type) {
    case 'created': {
      state.devices.push(payload.device)
      break
    }
    case 'updated': {
      state.devices.some((device, index) => {
        if (device.id === payload.device.id) {
          state.devices[index] = Object.assign(state.devices[index], payload.device)
          return true
        }
        return false
      })
      break
    }
    case 'deleted': {
      state.devices.some((device, index) => {
        if (device.id === payload.device.id) {
          state.devices.splice(index, 1)
          return true
        }
        return false
      })
      break
    }
  }
}
function reqFailed (state, payload) {
  if (DEV) {
    console.log('Failed Request')
    console.log(payload)
  }
  if (payload.response && payload.response.status) {
    switch (payload.response.status) {
      case 0: {
        setOfflineFlag(state, true)
        unsetDevicesInit(state)
        Vue.set(state, 'token', '')
        break
      }
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
}
function setOfflineFlag (state, flag) {
  Vue.set(state, 'offline', flag)
}
function setToken (state, val) {
  let token = val.replace('FlespiToken ', '')
  if (val && token.match(/^[a-z0-9]+$/i)) {
    Vue.connector.token = `FlespiToken ${token}`
    LocalStorage.set('X-Flespi-Token', token)
  } else {
    token = ''
    Vue.connector.token = ''
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
  Vue.connector.token = ''
  Vue.set(state, 'token', '')
}
function setActiveDevice (state, id) {
  if (state.hasDevicesInit && !state.devices.filter(device => device.id === id)[0].messages_ttl) {
    return
  }
  state.activeDevicesID.push(id)
  LocalStorage.set('TrackIt Active Devices', state.activeDevicesID)
  if (state.hasDevicesInit) {
    Router.push(`/devices/${state.activeDevicesID.join(',')}`)
  }
}
function unsetActiveDevice (state, id) {
  let index = state.activeDevicesID.indexOf(id)
  state.activeDevicesID.splice(index, 1)
  LocalStorage.set('TrackIt Active Devices', state.activeDevicesID)
  if (state.activeDevicesID.length) {
    Router.push(`/devices/${state.activeDevicesID.join(',')}`)
  } else {
    Router.push('/')
  }
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
  unsetDevicesInit,
  setOfflineFlag,
  updateDevices,
  setDevices
}
