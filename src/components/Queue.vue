<template>
  <div id="queue" class="absolute-bottom-left absolute-bottom-right">
    <q-tab-panels v-model="selected" animated style="background: rgba(0, 0, 0, .5)">
      <q-tab-panel
          class="no-padding"
          :name="deviceID.toString()"
          v-for="(deviceID) in activeDevicesID"
          :key="`tab-panel-${deviceID}`"
        >
          <queue-item
            :key="`tab-pane-${deviceID}`"
            :id="deviceID"
            :messages="messages[deviceID]"
            :date="date"
            :device="devices[deviceID]"
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
      <q-tab v-for="(deviceID) in activeDevicesID" :key="`tab-${deviceID}`" :name="deviceID.toString()" @click="messages[deviceID].length && markers[deviceID] && markers[deviceID]._icon ? changeTabColorHandler(deviceID) : ''">
        <div class="text-white">
          <div v-if="messages[deviceID].length && markers[deviceID] && markers[deviceID]._icon" :style="{backgroundColor: markers[deviceID].color}" class="color-view q-mr-xs" @click.stop="changeColorHandler(deviceID)"></div>
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
    'telemetryDeviceId',
    'date',
    'needShowMessages',
    'needShowPlayer',
    'markers',
    'player'
  ],
  data () {
    return {
      selected: this.activeDevicesID.length ? this.activeDevicesID[0].toString() : '',
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
    },
    changeTabColorHandler (id) {
      if (id.toString() === this.selected) {
        this.changeColorHandler(id)
      }
    }
  },
  created () {
    if (this.activeDevicesID.length) {
      this.$emit('change-selected', parseInt(this.activeDevicesID[0]))
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
        this.selected = newVal[0].toString()
      }
    },
    telemetryDeviceId (id) {
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
    .table__wrapper
      overflow auto
      font-size 80%
      position relative
    .no-messages
      min-height 140px
      opacity 0.7
    .q-tabs__arrow
      color white
    // .q-tabs
    //   height 100%
    //   .q-tab-label
    //     max-width 100px
    //     overflow hidden
    //     text-overflow ellipsis
    //   .q-tab-panel
    //     background-color rgba(0,0,0,.5)
  .color-modal
    .q-color-inputs
      display none
</style>
