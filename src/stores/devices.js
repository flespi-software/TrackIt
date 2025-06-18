import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { useAuthStore } from './auth'
import { useMiscStore } from './misc'

const miscStore = useMiscStore()

export const useDevicesStore = defineStore('devices', {
  state: () => ({
    devices: [], // devices available for the token
    activeDevicesIDs: [], // the list of active devices' ids
    devicesColors: {}, // devices' colors map
    devicesInitialized: false, // devices initialized flag
  }),
  getters: {
    getDeviceById: (state) => {
      return (deviceId) => {
        const device = state.devices.filter((device) => device.id === deviceId)[0]
        return device ? device : {}
      }
    },
    token: () => {
      // token that is managed in authStore
      return useAuthStore().token // TODO: get rid of ckeck of token
    },
  },
  actions: {
    async getInitDataByDeviceId([id, showInvalidPositionMessages]) {
      if (!this.token) {
        return
      }
      const telemetryResp = await this.$connector.gw.getDevicesTelemetry(id, 'position,ident')
      const telemetryRespData = telemetryResp.data
      miscStore.errorsCheck(telemetryRespData)
      const telemetry =
          telemetryRespData &&
          telemetryRespData.result[0] &&
          telemetryRespData.result[0].telemetry &&
          telemetryRespData.result[0].telemetry.position &&
          telemetryRespData.result[0].telemetry.position.value
            ? telemetryRespData.result[0].telemetry.position.value
            : {},
        telemetryFields = Object.keys(telemetry)
      if (!telemetryFields.length) {
        // no position in device's telemetry
        return false
      }
      if (
        !showInvalidPositionMessages &&
        telemetry['valid'] !== undefined &&
        telemetry['valid'] === false
      ) {
        // user doesn't want to see messages with invalid position, then filter out telemetry with position.valid=false
        return false
      }
      const initMessage = telemetryFields.reduce((message, paramName) => {
        message['position.' + paramName] = telemetry[paramName]
        return message
      }, {})
      // add timestamp and ident to the contracted init message
      if (telemetryRespData.result[0].telemetry.position.ts) {
        initMessage.timestamp = telemetryRespData.result[0].telemetry.position.ts
      }
      if (
        telemetryRespData.result[0].telemetry.ident &&
        telemetryRespData.result[0].telemetry.ident.value
      ) {
        initMessage.ident = telemetryRespData.result[0].telemetry.ident.value
      }

      Object.defineProperty(initMessage, 'x-flespi-inited-by-telemetry', {
        value: true,
        enumerable: false,
      })
      miscStore.getMessagesStore(id).setHistoryMessages([initMessage])
    },
    async getLatestPositionTimestamp() {
      let from = miscStore.date[0],
        to = miscStore.date[1]
      if (this.token) {
        const ids = this.activeDevicesIDs.join(',')
        let initTime = Date.now()
        if (ids) {
          let telemetryResp
          miscStore.requestStart('get devices telemetry', ids)
          try {
            telemetryResp = await this.$connector.gw.getDevicesTelemetry(
              ids,
              'position.latitude,position.longitude',
            )
          } catch (error) {
            miscStore.requestFailed(error)
          }
          if (telemetryResp && telemetryResp.data) {
            const telemetryRespData = telemetryResp.data
            miscStore.errorsCheck(telemetryRespData)
            const now = Math.max(
              ...telemetryRespData.result.reduce((result, info) => {
                result.push(
                  info.telemetry && info.telemetry['position.latitude']
                    ? Math.floor(info.telemetry['position.latitude'].ts * 1000)
                    : 0,
                )
                result.push(
                  info.telemetry && info.telemetry['position.longitude']
                    ? Math.floor(info.telemetry['position.longitude'].ts * 1000)
                    : 0,
                )
                return result
              }, []),
            )
            if (now) {
              initTime = now
            }
          }
        }
        from = new Date(initTime).setHours(0, 0, 0, 0)
        to = from + 86399999
      }
      return [from, to]
    },
    async poolDevices() {
      if (!this.token) {
        return
      }
      miscStore.requestStart('pool devices')
      try {
        const ids = await this.$connector.poolDevices(
          (resp) => {
            this.setDevices(resp)
          },
          (type, device) => {
            this.updateDevices(type, device)
          },
        )
        return async () => {
          await this.$connector.poolDevicesStop(ids)
        }
      } catch (error) {
        miscStore.requestFailed(error)
      }
    },

    addActiveDevice(id) {
      /* add device id into the list of active devices' ids, sync to local storage and update URL */
      if (this.activeDevicesIDs.includes(id)) {
        return
      }
      this.activeDevicesIDs.push(id)
      miscStore.setToStore({ store: LocalStorage, name: 'active', value: this.activeDevicesIDs })
      this.router.push(`/devices/${this.activeDevicesIDs.join(',')}`).catch((e) => {
        process.env.DEV && console.log(e)
      })
    },
    removeActiveDevice(id) {
      /* remove device id from the list of active devices, and sync to local storage */
      const index = this.activeDevicesIDs.indexOf(id)
      this.activeDevicesIDs.splice(index, 1)
      miscStore.setToStore({ store: LocalStorage, name: 'active', value: this.activeDevicesIDs })
      if (this.activeDevicesIDs.length) {
        this.router.push(`/devices/${this.activeDevicesIDs.join(',')}`).catch((e) => {
          process.env.DEV && console.log(e)
        })
      } else {
        this.router.push('/').catch((e) => {
          process.env.DEV && console.log(e)
        })
      }
    },
    setActiveDevicesIDs(ids) {
      if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'number')) {
        /* expecting array of numbers here */
        console.log("[devices store]: setActiveDevicesIDs() expects array of devices' ids as an argument")
        return
      }
      /* replace active devices' ids with new values */
      this.activeDevicesIDs.splice(0, this.activeDevicesIDs.length, ...ids)
      /* sync to local storage */
      miscStore.setToStore({ store: LocalStorage, name: 'active', value: this.activeDevicesIDs })
    },
    setDevices(response) {
      /* this is poolDevices getHandler callback */
      /* it's called when HTTP GET gw/devices/all request is executed */
      if (JSON.stringify(this.devices) !== JSON.stringify(response.data.result)) {
        /* the list of available devices has changed, set new actual list of devices into the store */
        this.devices = response.data.result
      }
      console.log('[devices storage]: setDevices()', this.activeDevicesIDs, this.devices)

      /* verify the list of active devices' ids against actully existing devices */
      /* list of active devices ids is already loaded either from URL or from local storage */
      const verifiedActiveDevices = []
      this.activeDevicesIDs.forEach((id) => {
        if (this.devices.filter((device) => device.id === id).length) {
          verifiedActiveDevices.push(id)
        }
      })
      this.setActiveDevicesIDs(verifiedActiveDevices)

      /* load and validate devices' colors */
      let devicesColorsLS = miscStore.getFromStore({ store: LocalStorage, name: 'colors' })
      if (!devicesColorsLS) {
        /* init colors object in localstorage, if not yet */
        devicesColorsLS = {}
      }
      /* ensure that all devices have assigned colors, synced to localstorage */
      const verifiedDevicesColors = {}
      const letters = '0123456789ABCDEF'
      this.devices.forEach((device) => {
        if (devicesColorsLS[device.id]) {
          verifiedDevicesColors[device.id] = devicesColorsLS[device.id]
        } else {
          let color = `#${letters[Math.floor(Math.random() * 5)]}`
          for (let i = 0; i < 5; i++) {
            color += letters[Math.floor(Math.random() * 15)]
          }
          verifiedDevicesColors[device.id] = color
        }
      })
      miscStore.setToStore({ store: LocalStorage, name: 'colors', value: verifiedDevicesColors })
      this.devicesColors = verifiedDevicesColors
      /* set devices initialized flag to hide loager */
      this.devicesInitialized = true
      /* route to the URL only if active devices are already verified */
      if (this.activeDevicesIDs.length) {
        this.router.push(`/devices/${this.activeDevicesIDs.join(',')}`).catch((e) => {
          process.env.DEV && console.log(e)
        })
      } else {
        this.router.push('/').catch((e) => {
          process.env.DEV && console.log(e)
        })
      }
    },
    unsetDevicesInitialized() {
      this.devicesInitialized = false
      this.devices = []
      this.activeDevicesIDs = []
    },
    updateDeviceColor(id, color) {
      /* update device's color and sync updated colors to localstorage */
      this.devicesColors[id] = color
      miscStore.setToStore({ store: LocalStorage, name: 'colors', value: this.devicesColors })
    },
    updateDevices(type, device) {
      /* this is poolDevices updateHandler callback */
      /* it's called when MQTT flespi/log/gw/devices/+/created,updated,deleted event is received  */

      console.log('[devices storage] updateDevices, type, device: ', type, device)
      switch (type) {
        case 'created': {
          // TODO: do not received this event
          this.devices.push(device)
          break
        }
        case 'updated': {
          this.devices.some((currentDevice, index) => {
            if (currentDevice.id === device.id) {
              // TODO: do reactive update of the device
              this.devices[index] = Object.assign(this.devices[index], device)
              return true
            }
            return false
          })
          break
        }
        case 'deleted': {
          this.devices.some((currentDevice, index) => {
            if (currentDevice.id === device.id) {
              this.devices.splice(index, 1)
              return true
            }
            return false
          })
          break
        }
      }
    },
  },
})
