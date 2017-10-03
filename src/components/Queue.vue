<template>
  <div id="queue" class="absolute-bottom-left absolute-bottom-right">
    <q-tabs v-model="selected" no-pane-border position="bottom" color="dark">
      <template v-for="(deviceID, index) in activeDevicesID">
        <q-tab-pane :style="[{height:'20vh'}]" class="no-padding" :key="`tab-pane-${deviceID}`" :name="deviceID.toString()">
          <div class="no-messages text-center" v-if="!messages[deviceID].length">
            <div class="text-white" style="font-size: 3rem;">No messages</div>
            <q-btn color="dark" v-if="isAdmin" @click="sendInitMessages(deviceID)">Send message</q-btn>
          </div>
          <div :style="{height: '100%'}" class="table__wrapper" v-if="messages[deviceID].length">
            <table class="q-table highlight striped-odd cell-separator compact full-width text-white">
              <thead>
              <tr>
                <th>Lat</th>
                <th>Lon</th>
                <th>Alt</th>
                <th>Direction</th>
                <th>Satellites</th>
                <th>Speed</th>
                <th>Time</th>
                <th>Params</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="message in messages[deviceID]">
                <td data-th="Lat">{{message['position.latitude']}}</td>
                <td data-th="Lon">{{message['position.longitude']}}</td>
                <td data-th="Alt">{{message['position.altitude']}}</td>
                <td data-th="Direction">{{message['position.direction']}}</td>
                <td data-th="Satellites">{{message['position.satellites']}}</td>
                <td data-th="Speed">{{message['position.speed']}}</td>
                <td data-th="Time">{{getTime(message['timestamp'] * 1000)}}</td>
                <td data-th="Params">{{getEtc(message)}}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </q-tab-pane>
        <q-tab :key="`tab-${deviceID}`" :label="getNameById(deviceID)" slot="title" :name="deviceID.toString()" />
      </template>
    </q-tabs>
  </div>
</template>

<script>
  import { QAlert, QTabs, QTab, QTabPane, QBtn } from 'quasar-framework'
  import moment from 'moment'
  export default {
    name: 'Queue',
    props: [
      'messages',
      'activeDevicesID',
      'devices',
      'isAdmin',
      'telemetryDeviceId'
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
      getEtc (msg) {
        let buf = Object.assign({}, msg)
        delete buf['position.latitude']
        delete buf['position.longitude']
        delete buf['position.altitude']
        delete buf['position.direction']
        delete buf['position.satellites']
        delete buf['position.speed']
        delete buf['timestamp']
        delete buf['device_id']
        if (!Object.keys(buf).length) {
          return '*Empty*'
        }
        return JSON.stringify(buf)
      },
      getNameById (id) {
        return this.devices.filter(device => device.id === id)[0].name || `&lt;#${id}&gt;`
      },
      getTime (ts) {
        return moment(ts).format('L HH:mm:ss')
      },
      sendInitMessages (id) {
        this.$emit('send', id)
      }
    },
    components: {
      QAlert, QTabs, QTab, QTabPane, QBtn
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
    }
  }
</script>

<style lang="stylus">
  #queue
    z-index: 1000
    table
      width 100%
      td[data-th=Params]
        word-break: break-word;
    .table__wrapper
      overflow auto
      font-size 80%
      transition all .5s ease-in-out
      thead
        background-color: rgba(255, 255, 255, .3);
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
