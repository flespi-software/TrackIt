<template>
  <div id="queue" class="absolute-bottom-left absolute-bottom-right">
    <q-tab-panels v-model="selected" animated style="background: rgba(0, 0, 0, .5)">
      <q-tab-panel
          class="no-padding no-scroll"
          :name="deviceID.toString()"
          v-for="(deviceID) in activeDevicesID"
          :key="`tab-panel-${deviceID}`"
        >
          <queue-item
            :key="`tab-pane-${deviceID}`"
            :id="deviceID"
            :messages="messages[deviceID]"
            :date="date"
            :needShowMessages="needShowMessages"
            :needShowPlayer="needShowPlayer"
            :player="player"
            @player-value="playHandler"
            @player-play="data => $emit('player-play', data)"
            @player-pause="data => $emit('player-pause', data)"
            @player-stop="stopHandler"
            @player-speed="data => $emit('player-speed', data)"
            @player-mode="data => $emit('player-mode', data)"
            @change-need-show-messages="(flag) => {$emit('change-need-show-messages', flag)}"
            @view-on-map="(content)=>{ $emit('view-on-map', content) }"
          />
        </q-tab-panel>
    </q-tab-panels>
    <q-tabs v-if="devices.length > 1" v-model="selected" align="left" class="bg-grey-9" dark indicator-color="white">
      <q-tab v-for="(deviceID) in activeDevicesID" :key="`tab-${deviceID}`" :name="deviceID.toString()" :class="{'inactive-device': checkDeviceInactive(deviceID)}">
        <q-tooltip v-if="deviceTabTooltips[deviceID]">{{deviceTabTooltips[deviceID]}}</q-tooltip>
        <div class="text-white">
          <div v-if="messages[deviceID].length && markers[deviceID]" :style="{backgroundColor: markers[deviceID].color}" class="color-view q-mr-xs" @click.stop="changeColorHandler(deviceID)"></div>
          <div v-else :style="{backgroundColor: '#909090'}" class="color-view q-mr-xs"></div>
          {{getNameById(deviceID)}}
        </div>
      </q-tab>
    </q-tabs>
    <color-modal ref="colorModal" v-model="color"/>
  </div>
</template>

<script>
import QueueItem from './QueueItem'
import ColorModal from './ColorModal'
export default {
  name: 'Queue',
  props: [
    'messages',
    'activeDevicesID',
    'devices',
    'selectedDeviceId',
    'telemetryDeviceId',
    'date',
    'needShowMessages',
    'needShowPlayer',
    'markers',
    'player'
  ],
  data () {
    return {
      selected: null,
      deviceTabTooltips: {},
      telemetryOfActiveDevices: this.devices.filter(device => this.activeDevicesID.includes(device.id)).reduce((res, device) => {
        res[device.id] = device.telemetry ? device.telemetry : null
        return res
      }, {}),
      playerValue: 0,
      currentColorModel: '#fff',
      currentColorId: 0
    }
  },
  computed: {
    color: {
      get () { return this.currentColorModel },
      set (color) {
        this.$emit('update-color', { id: this.currentColorId, color })
        this.currentColorModel = color
      }
    }
  },
  methods: {
    getNameById (id) {
      return this.devices.filter(device => device.id === id)[0].name || `<#${id}>`
    },
    checkDeviceInactive (id) {
      /* check if this device is inactive to highlight its tab */
      const device = this.devices.filter(device => device.id === id)[0]
      if (device && device['x-flespi-no-access']) {
        /* the device doesn't have access to messages and telemetry */
        this.deviceTabTooltips[id] = 'Device has no access to messages and telemetry'
        return true
      }
      return false
    },
    playHandler (data) {
      this.$emit('player-value', data)
    },
    stopHandler (data) {
      this.$emit('player-stop', data)
    },
    changeColorHandler (id) {
      this.currentColorId = id
      this.currentColorModel = this.markers[id].color
      this.$refs.colorModal.show()
    }
  },
  created () {
    if (this.activeDevicesID.length) {
      this.$emit('queue-created')
    }
    if (this.selectedDeviceId) {
      this.selected = this.selectedDeviceId.toString()
    }
  },
  watch: {
    devices: {
      deep: true,
      handler (val) {
        this.telemetryOfActiveDevices = val.filter(device => this.activeDevicesID.includes(device.id)).reduce((res, device) => {
          res[device.id] = device.telemetry ? device.telemetry : null
          return res
        }, {})
      }
    },
    activeDevicesID (newVal) {
      this.telemetryOfActiveDevices = this.devices.filter(device => newVal.includes(device.id)).reduce((res, device) => {
        res[device.id] = device.telemetry ? device.telemetry : null
        return res
      }, {})
      if (!newVal.length) {
        this.selected = ''
      }
      if ((!this.selected || !newVal.includes(parseInt(this.selected))) && newVal.length) {
        this.selected = newVal[newVal.length - 1].toString()
      }
    },
    telemetryDeviceId (id) {
      if (id) {
        this.selected = id.toString()
      }
    },
    selectedDeviceId (id) {
      if (id) {
        this.selected = id.toString()
      }
    },
    selected (selected) {
      this.$emit('change-selected', parseInt(selected))
    }
  },
  components: { QueueItem, ColorModal }
}
</script>

<style lang="stylus">
  #queue
    z-index 1000
    .color-view
      display inline-block
      width 12px
      height 12px
      border solid white 2px
      border-radius 50%
    .inactive-device
      box-shadow inset 0 0 10px #f40
    .table__wrapper
      overflow auto
      font-size 80%
      position relative
    .no-messages
      min-height 140px
      opacity 0.7
    .q-tabs__arrow
      color white
  .color-modal
    .q-color-inputs
      display none
</style>
