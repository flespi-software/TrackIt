import { defineStore } from 'pinia'
import { useMiscStore } from './misc'

const miscStore = useMiscStore()

export const useTelemetryStore = defineStore('telemetry', {
  state: () => ({
    isLoading: undefined,
    telemetry: {},
    updateIntervalId: 0,
  }),
  getters: {
    telemetryKeys() {
      return Object.keys(this.telemetry)
    },
  },
  actions: {
    setParameter(payload) {
      Object.keys(payload).forEach((key) => {
        if (
          !this.telemetry[key] ||
          (this.telemetry[key] && this.telemetry[key].ts <= payload[key].ts)
        ) {
          this.telemetry[key] = payload[key]
        }
      })
    },
    async unsubscribeDeviceTelemetry(deviceId) {
      clearInterval(this.updateIntervalId)
      this.$connector.socket.unsubscribe(`flespi/state/gw/devices/${deviceId}/telemetry/+`)
      this.telemetry = {}
      this.isLoading = undefined
    },
    async subscribeDeviceTelemetry(deviceId) {
      /* fetch telemetry for current device and setup processing function */
      try {
        if (deviceId > 0) {
          this.isLoading = true
          let messages = [],
            messagesProcess = () => {
              messages.forEach((packet) => {
                let topic = packet.topic,
                  message = packet.payload,
                  name = topic.split('/').reverse()[0]
                if (name === 'position') {
                  return false
                }
                let value = message.toString(),
                  ts =
                    packet.properties &&
                    packet.properties.userProperties &&
                    packet.properties.userProperties.timestamp,
                  telemetry = {
                    [name]: {
                      value,
                      ts,
                    },
                  }
                this.setParameter(telemetry)
              })
              messages = []
              this.isLoading = false
            }
          /* subscribe to new device telemetry */
          await this.$connector.socket.subscribe({
            name: `flespi/state/gw/devices/${deviceId}/telemetry/+`,
            handler(message, topic, packet) {
              messages.push(packet)
            },
          })
          this.updateIntervalId = setInterval(messagesProcess, 500)
        }
      } catch (error) {
        miscStore.requestFailed(error)
      }
    },
  },
})
