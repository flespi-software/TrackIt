import { defineStore } from 'pinia'
import { date, Notify } from 'quasar'
import { useAuthStore } from './auth'
import { useMessagesStore } from 'qvirtualscroll'

const currentDate = new Date().setHours(0, 0, 0, 0)
const unitsInSec = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity]
const unitStrings = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year']

export const useMiscStore = defineStore('misc', {
  state: () => ({
    date: [currentDate, currentDate + 86399999], // application-wide date, initially set to current day, but later init from telemetry of active devices
    dateInitialized: false, // date already initialized flag, to avoid initialiation of the date by devices telemetry, if it's already set via query parameters
    errors: [],
    newErrorsCounter: 0,
    lsNamespace: 'flespi-trackit-settings', // application-wide namespace for local storage, will be passed to messages store that comes from QVirtualScroll
  }),
  getters: {
    token: () => {
      // token that is managed in authStore
      return useAuthStore().token
    },
  },
  actions: {
    addError(message) {
      if (!this.token) {
        return false
      }
      Notify.create({
        color: 'negative',
        icon: 'mdi-alert',
        message: `${message}`,
        timeout: 1000,
      })
      this.newErrorsCounter++
      this.errors.push(message)
    },
    clearErrors() {
      this.errors.splice(0, this.errors.length)
    },
    errorsCheck(data) {
      if (data.errors) {
        this.requestError(data.errors)
        data.errors.forEach((error) => {
          this.addError(error.reason)
        })
      } else {
        this.requestFullfiled()
      }
    },
    formatTimestampToDate(timestamp) {
      /* timestamp is expected to be in seconds*/
      return date.formatDate(timestamp * 1000, 'DD/MM/YYYY HH:mm:ss')
    },
    fromNow(ts) {
      const now = Date.now()
      const diff = Math.floor((now - ts) / 1000) // in seconds
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

      // Find the appropriate unit based on the seconds difference
      const unitIndex = unitsInSec.findIndex((cutoff) => cutoff > Math.abs(diff))

      // Get the divisor to convert seconds to the appropriate unit
      const divisor = unitIndex ? unitsInSec[unitIndex - 1] : 1

      const relativeTime = rtf.format(-Math.floor(diff / divisor), unitStrings[unitIndex])

      return relativeTime
    },
    getMessagesStore(id, errorHandler) {
      /* returns messages store for the device */
      return useMessagesStore(id, this.lsNamespace, errorHandler)
    },
    getFromStore({ store, name }) {
      const data = store.getItem(this.lsNamespace)
      return data && data[name]
    },
    requestError(error) {
      console.log('[request error]:', JSON.stringify(error))
    },
    requestFailed(payload) {
      if (process.env.DEV) {
        console.log('[request failed]:', payload)
      }
      /* http errors */
      if (payload.response && payload.response.status) {
        switch (payload.response.status) {
          case 0: {
            // setOfflineFlag(state, true)
            // unsetDevicesInit(state)
            // Vue.set(state, 'token', '')
            break
          }
          case 401: {
            // unauthorized error, wrong token
            useAuthStore().clearToken()
            break
          }
          case 403: {
            // no access provided
            break
          }
          default: {
            if (process.env.DEV) {
              console.log(`${payload.status} - ${payload.statusText}`)
            }
            // if (payload.response.data && payload.response.data.errors && payload.response.data.errors.length) {
            //   payload.response.data.errors.forEach((e) => { addError(state, e.reason) })
            // }
          }
        }
        /* mqtt errors */
      } else if (payload.code && payload.message) {
        switch (payload.code) {
          case 2:
          case 134:
          case 135: {
            // if (state.token) {
            //   clearToken(state)
            // }
            // addError(state, payload.message)
            break
          }
        }
      } else {
        // addError(state, payload.message)
      }
    },
    requestStart(info) {
      if (process.env.DEV) {
        // console.log("[request started]:", info)
      }
    },
    requestFullfiled() {
      if (process.env.DEV) {
        // console.log("[request fullfilled]")
      }
    },
    resetNewErrorsCounter() {
      this.newErrorsCounter = 0
    },
    setDate(date) {
      this.date = date
    },
    setDateInitialized() {
      this.dateInitialized = true
    },
    setToStore({ store, name, value }) {
      let data = store.getItem(this.lsNamespace)
      if (!data) {
        data = {}
      }
      if (value) {
        data[name] = value
      } else {
        delete data[name]
      }
      store.set(this.lsNamespace, data)
    },
  },
})
