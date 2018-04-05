<template>
  <div id="queue" class="absolute-bottom-left absolute-bottom-right">
    <q-tabs v-model="selected" no-pane-border position="bottom" color="dark">
      <template v-for="(deviceID) in activeDevicesID">
        <q-tab-pane :style="[{height:'20vh', position: 'relative'}]" class="no-padding" :key="`tab-pane-${deviceID}`" :name="deviceID.toString()">
          <div class="no-messages text-center" v-if="!messages[deviceID].length">
            <div class="text-white" style="font-size: 3rem;">
              <div>No messages</div>
              <div style="font-size: 1.5rem;">or position is empty</div>
            </div>
            <q-btn color="dark" v-if="isAdmin && mode === 1" @click="sendInitMessages(deviceID)">Send message</q-btn>
          </div>
          <div class="table__wrapper" v-if="messages[deviceID].length">
            <messages
              :messages="messages[deviceID]"
              :mode="mode"
              :item="devices[deviceID]"
              :activeId="deviceID"
              :limit="2000"
              :date="date"
            ></messages>
          </div>
        </q-tab-pane>
        <q-tab :key="`tab-${deviceID}`" :label="getNameById(deviceID)" slot="title" :name="deviceID.toString()" />
      </template>
    </q-tabs>
  </div>
</template>

<script>
import Messages from './Messages'
export default {
  name: 'Queue',
  props: [
    'messages',
    'activeDevicesID',
    'devices',
    'isAdmin',
    'telemetryDeviceId',
    'mode',
    'date'
  ],
  data () {
    return {
      selected: this.activeDevicesID.length ? this.activeDevicesID[0].toString() : '',
      telemetryOfActiveDevices: this.devices.filter(device => this.activeDevicesID.includes(device.id)).reduce((res, device) => {
        res[device.id] = device.telemetry ? device.telemetry : null
        return res
      }, {})
    }
  },
  methods: {
    getNameById (id) {
      return this.devices.filter(device => device.id === id)[0].name || `&lt;#${id}&gt;`
    },
    sendInitMessages (id) {
      this.$emit('send', id)
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
    }
  },
  components: {Messages}
}
</script>

<style lang="stylus">
  #queue
    z-index: 1000
    table
      width 100%
      td
        white-space nowrap
    .table__wrapper
      overflow auto
      font-size 80%
      transition all .5s ease-in-out
      height 100%
    .no-messages
      min-height: 140px;
      opacity: 0.7;
    .q-tabs
      height 100%
      .q-tab-label {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .q-tab-pane
        background-color rgba(0,0,0,.5);
        transition all .5s ease-in-out
</style>
