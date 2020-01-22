<template>
  <q-layout ref="layout" view="hHh LpR lFf">
    <q-drawer v-if="isInit" side="left" :no-swipe-open="$q.platform.is.desktop" :no-swipe-close="$q.platform.is.desktop" v-model="side_left" :breakpoint="576" behavior="mobile">
      <device-list v-show="devices.length" @update:watch-by-id="setWatchToDeviceID" :deviceIdForWatch="deviceIdForWatch" :activeDevicesID="activeDevicesID" :devices="devices" @click:hide="side_left = false"/>
    </q-drawer>
    <q-drawer side="right" no-swipe-open no-swipe-close :content-class="{'bg-grey-9':telemetrySettings.inverted}" v-model="side_right">
      <div style="position: relative; height: 100vh; overflow: hidden;">
        <q-item>
          <q-item-section avatar><q-icon :color="telemetrySettings.inverted ? 'white' : ''" size="1.8rem" name="developer_board"/></q-item-section>
          <q-item-section>
            <q-item-label header class="ellipsis text-bold q-pa-none" :class="{'text-white': telemetrySettings.inverted}">Telemetry</q-item-label>
            <q-item-label v-if="deviceIdForTelemetry" caption class="ellipsis" :class="{'text-white': telemetrySettings.inverted}"><small>{{deviceForTelemetry.name || `#${deviceForTelemetry.id}`}}</small></q-item-label>
            <q-item-label v-else caption class="ellipsis" :class="{'text-white': telemetrySettings.inverted}"><small>No selected device</small></q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn :color="telemetrySettings.inverted ? 'white' : 'grey'" flat class="text-grey" icon="filter_b_and_w" @click="telemetrySettingsChangeHandler">
              <q-tooltip>Inverted</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
        <q-item v-if="deviceIdForTelemetry">
          <q-item-section>
            <q-input type="text" label="Search" v-model="telemetrySearch" :dark="telemetrySettings.inverted" :color="telemetrySettings.inverted ? 'white' : 'grey'" />
          </q-item-section>
        </q-item>
        <q-telemetry class="scroll" style="height: calc(100% - 128px)" v-if="deviceIdForTelemetry" :propHistoryFlag="telemetryConfig.propHistoryFlag" :device="deviceForTelemetry" :inverted="telemetrySettings.inverted" :search="telemetrySearch" />
        <div v-else class="text-bold text-center q-mt-sm" :class="{'text-white': telemetrySettings.inverted}">
          Select one by clicking on its <q-icon name="mdi-map-marker"/> marker
        </div>
      </div>
    </q-drawer>
    <q-page-container>
      <q-page>
        <q-btn @click="side_left = !side_left" small round flat color="bg-grey-9" size="md" v-if="devices.length" class="floated menu">
          <q-icon name="menu" />
        </q-btn>
        <div class="floated label">
          <img src="../statics/track-it-logo.png" alt="Track it!" style="height: 40px; margin-top: 3px; display: inline-block">
          <div class="q-toolbar-title" style="color: rgb(51, 51, 51); display: inline-block">
            Track it! <sup>{{version}}</sup>
            <div class="q-toolbar-subtitle">
              Find yourself
            </div>
          </div>
        </div>
        <q-btn v-if="errors.length" @click="clearNotificationCounter" small flat round color="bg-grey-9" size="md" icon="notifications" class="floated notifications">
          <q-chip v-if="newNotificationCounter" color="red" class="absolute-top-right q-pa-xs text-white" style="font-size: .6rem;">{{newNotificationCounter}}</q-chip>
          <q-menu fit ref="popoverError">
            <q-list no-border style="max-height: 200px" link separator class="scroll">
              <q-item
                v-for="(error, index) in errors"
                :key="index"
                style="cursor: default"
              >
                <q-item-section>
                  <q-item-label>{{error}}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <div v-if="devices.length && mode === 0" class="floated date">
          <q-btn flat style="max-width: 120px; font-size: .85rem; line-height: .85rem;" class="q-pa-none" @click="$refs.datePickerModal.toggle()">
            <div>{{formatDate(date)}}</div>
          </q-btn>
          <q-dialog ref="datePickerModal" content-class="modal-date">
            <q-card>
              <q-card-section class="q-pa-none">
                <div class="flex flex-center">
                  <vue-flat-pickr
                    :value="dateValue"
                    @input="dateInputHandler"
                    :config="dateConfig"
                  />
                </div>
              </q-card-section>
              <q-separator />
              <q-card-actions align="right">
                <q-btn flat @click="datePickerModalClose">close</q-btn>
                <q-btn flat @click="datePickerModalSave">save</q-btn>
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
        <div v-if="!activeDevicesID.length && devices.length" class="floated no-devices">
          <span class="no-devices__message">You have no selected devices</span>
          <div style="margin-top: 15px;">
            <q-btn icon="menu" style="pointer-events: auto" @click="side_left = !side_left" color="black" size="md">
              select devices
            </q-btn>
          </div>
        </div>
        <div v-else-if="!devices.length && hasDevicesInit" class="floated no-devices">
          <span class="no-devices__message">You have no devices</span>
          <div class="q-mt-sm text-bg-grey-9" style="font-size: 1.3rem;">
            Create one on
            <q-btn dense style="pointer-events: auto" @click="openURL('https://flespi.io')" color="red-5" label="flespi.io"/>
          </div>
        </div>
        <q-btn small dense flat size="md" v-if="devices.length" class="floated mode" :icon="mode === 1 ? 'playlist_play' : 'history'" @click="changeMode">
          <q-tooltip>Change mode (History/Real-time)</q-tooltip>
        </q-btn>
        <a v-if="$q.platform.is.desktop" href="https://github.com/flespi-software/TrackIt/" class="floated github" target="_blank"><q-btn flat round color="bg-grey-9"><img style="height: 30px;" src="../statics/GitHub-Mark-32px.png" alt="GitHub"><q-tooltip>Show on GitHub</q-tooltip></q-btn></a>
        <q-btn small round flat size="md" class="floated options">
          <q-icon color="bg-grey-9" name="more_vert" />
          <q-menu ref="popover-menu">
            <q-list link separator class="scroll" style="min-width: 200px">
              <q-item>
                <q-toggle @input="menuChangeHandler" :disabled="!devices.length" v-model="params.needShowMessages" icon="dvr" label="Messages" />
              </q-item>
              <q-item>
                <q-toggle @input="menuChangeHandler" v-model="params.needShowPlayer" :disable="mode === 1 || !devices.length" icon="mdi-play" label="Player" :title="mode === 1 ? 'Only in history mode' : ''" />
              </q-item>
              <q-item>
                <q-toggle v-close-popup @input="menuChangeHandler" :disabled="!devices.length" v-model="params.needShowTelemetry" icon="av_timer" label="Telemetry" />
              </q-item>
              <q-item>
                <q-toggle @input="menuChangeHandler" :disabled="!devices.length" v-model="params.needShowNamesOnMap" icon="pin_drop" label="Names" />
              </q-item>
              <q-item class="within-iframe-hide" @click="exitHandler" clickable>
                <q-item-section avatar class="q-pl-md">
                  <q-icon name="exit_to_app" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Exit</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <map-component
          @update:telemetry-device-id="updateTelemetryDeviceId"
          :activeDevices="activeDevices"
          :deviceIdForWatch="deviceIdForWatch"
          :params="params"
          :mode="mode"
          :date="date"
          @change:needShowMessages="(value) => { params.needShowMessages = value }"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import Vue from 'vue'
import { mapState, mapMutations, mapActions } from 'vuex'
import { VueFlatPickr } from 'datetimerangepicker'
import { QTelemetry, telemetryVuexModule } from 'qtelemetry'
import MapComponent from '../components/Map.vue'
import DeviceList from '../components/DeviceList.vue'
import dist from '../../package.json'
import { openURL, date } from 'quasar'

export default {
  data () {
    return {
      deviceIdForWatch: null,
      deviceIdForTelemetry: null,
      params: {
        needShowMessages: false,
        needShowTelemetry: false,
        needShowNamesOnMap: true,
        needShowPlayer: true
      },
      side_left: false,
      side_right: false,
      telemetrySettings: {
        inverted: true
      },
      mode: 1,
      telemetrySearch: '',
      telemetryConfig: {
        propHistoryFlag: true
      },
      version: dist.version,
      date: undefined,
      dateValue: undefined,
      dateConfig: {
        inline: true,
        maxDate: (new Date()).setHours(23, 59, 59, 999),
        mode: 'single',
        locale: { firstDayOfWeek: 1 }
      },
      isInit: Vue.connector.socket.connected(),
      unsubscribeDevices: () => {}
    }
  },
  computed: {
    ...mapState({

      token: (state) => state.token,
      devices: (state) => state.devices,
      isLoading: (state) => {
        return state.isLoading
      },
      activeDevicesID (state) {
        if (this.mode === 0) {
          this.getLastUpdatePosition()
            .then((date) => {
              this.date = date || undefined
              this.dateValue = date || undefined
            })
        }
        return state.activeDevicesID
      },
      hasDevicesInit: state => state.hasDevicesInit,
      activeDevices: state => state.devices.filter(device => state.activeDevicesID.includes(device.id)),
      lastActiveDevicesUpdate (state) {
        return this.activeDevicesID.reduce((result, id) => {
          let messages = state.messages[id].messages.filter((message) => {
            return !!message['position.latitude'] && !!message['position.longitude']
          })
          if (!messages.length) {
            result[id] = 0
          } else {
            result[id] = Math.floor(messages[messages.length - 1].timestamp * 1000)
          }
          return result
        }, {})
      },
      errors: state => state.errors,
      newNotificationCounter: state => state.newNotificationCounter,
      deviceForTelemetry (state) {
        return this.deviceIdForTelemetry ? state.devices.filter(device => device.id === this.deviceIdForTelemetry)[0] : {}
      }
    })
  },
  components: {
    DeviceList,
    MapComponent,
    QTelemetry,
    VueFlatPickr
  },
  methods: {
    openURL,
    ...mapMutations([
      'setToken',
      'clearToken',
      'setDevicesInit',
      'unsetDevicesInit',
      'setActiveDevice',
      'reqFailed',
      'clearNotificationCounter',
      'clearErrors'
    ]),
    ...mapActions(['getLastUpdatePosition', 'poolDevices']),
    exitHandler (e) {
      Vue.connector.socket.off('error')
      this.unsetDevicesInit()
      this.clearToken()
      this.$router.push('/login')
    },
    setWatchToDeviceID (id) {
      this.updateTelemetryDeviceId(id)
      this.deviceIdForWatch = id
    },
    menuChangeHandler (val) {
      this.$q.localStorage.set('TrackIt Params', this.params)
    },
    telemetrySettingsChangeHandler () {
      this.$set(this.telemetrySettings, 'inverted', !this.telemetrySettings.inverted)
      this.$q.localStorage.set('TrackIt TelemetrySettings', this.telemetrySettings)
    },
    updateTelemetryDeviceId (id) {
      if (this.deviceIdForTelemetry === id) {
        this.setWatchToDeviceID(null)
        return false
      }
      let devicesById = this.devices.filter(device => device.id === id)
      if (devicesById.length) {
        this.deviceIdForTelemetry = id
        this.deviceIdForWatch = id
        if (this.params.needShowTelemetry && this.deviceIdForTelemetry && this.activeDevicesID.includes(this.deviceIdForTelemetry)) {
          setTimeout(() => {
            if (id === this.deviceIdForWatch && this.$q.platform.is.mobile) {
              return false
            }
          }, 0)
        }
      } else {
        this.deviceIdForTelemetry = null
      }
    },
    changeMode () {
      if (this.mode === 1) {
        /* history mode change logic */
        this.getLastUpdatePosition()
          .then((date) => {
            this.date = date || undefined
            this.dateValue = date || undefined
            this.mode = 0
          })
      } else {
        /* rt mode change logic */
        this.date = undefined
        this.dateValue = undefined
        this.mode = 1
      }
    },
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY')
    },
    datePickerModalClose () {
      this.dateValue = this.date
      this.$refs.datePickerModal.hide()
    },
    datePickerModalSave () {
      this.date = this.dateValue
      this.$refs.datePickerModal.hide()
    },
    dateInputHandler (date) {
      this.dateValue = date ? date.setSeconds(0) : new Date()
    }
  },
  watch: {
    token (val) {
      if (!val) {
        this.$router.push('/login')
      }
    },
    hasDevicesInit (val) {
      if (val) {
        this.$q.loading.hide()
        // if (this.devices.length) {
        //   this.side_left = true
        // }
      } else {
        this.$q.loading.show()
      }
    },
    deviceIdForWatch (id) {
      if (id) {
        this.side_left = false
      }
    },
    devices (devices, prev) {
      if (!devices.length) {
        this.side_left = false
        this.side_right = false
      }
      // else if (devices.length && !prev.length) {
      //   this.side_left = true
      // }
    },
    'params.needShowTelemetry': function (value) {
      this.side_right = value
    }
  },
  created () {
    this.$store.registerModule('telemetry', telemetryVuexModule(this.$store, Vue))
    this.clearNotificationCounter()
    this.clearErrors()
    if (!this.token) {
      if (this.$route.params.devices) {
        let active = this.$route.params.devices.split(',').map(id => +id)
        active.forEach((id) => {
          this.setActiveDevice(id)
        })
      }
      if (this.$route.params.token) {
        this.$router.push(`/login/${this.$route.params.token}`)
      } else {
        this.$router.push('/login')
      }
      return false
    }
    if (!this.isInit) {
      Vue.connector.socket.on('connect', () => {
        this.isInit = true
        this.$q.loading.hide()
      })
      this.$q.loading.show()
    }
    this.poolDevices().then(callback => { this.unsubscribeDevices = callback })
    if (this.activeDevicesID.length) {
      this.$router.push(`devices/${this.activeDevicesID.join(',')}`)
      // watching current device if it one
      if (this.activeDevicesID.length === 1) {
        this.deviceIdForWatch = this.activeDevicesID[0]
      }
    }
    let params = this.$q.localStorage.getItem('TrackIt Params')
    if (params) {
      Vue.set(this, 'params', Object.assign(this.params, params))
      this.side_right = params.needShowTelemetry
    }
    let telemetrySettings = this.$q.localStorage.getItem('TrackIt TelemetrySettings')
    if (telemetrySettings) {
      Vue.set(this, 'telemetrySettings', Object.assign(this.telemetrySettings, telemetrySettings))
    }
  },
  destroyed () {
    this.unsubscribeDevices && this.unsubscribeDevices()
    Vue.connector.socket.off('connect')
  }
}
</script>

<style lang="stylus">
  .floated
    z-index 2000
    position absolute
    &.label
      color: #333
      top: 5px
      left: 70px
      border-radius: 5px
      opacity: .9
      pointer-events none
      user-select none
    &.menu
      top 5px
      left 10px
    &.github
      top 5px
      right 50px
    &.notifications
      top 5px
      right 100px
    &.options
      top 5px
      right 10px
    &.mode
      top 60px
      right 10px
      background-color white
      box-shadow 0 0 15px rgba(0,0,0,0.5)
      padding 2px 10px
    &.date
      top 60px
      right 70px
      background-color white
      padding 1px
      border-radius 3px
      box-shadow 0 0 15px rgba(0,0,0,0.5)
    &.no-devices
      bottom 150px
      text-align center
      width 100%
      pointer-events none
      user-select none
      .no-devices__message
        font-size 3rem
        opacity .5
        font-weight bolder
        text-transform uppercase
  .error-page
    height 100vh
    .error-code
      height 50vh
      width 100%
      padding-top 15vh
      font-size 10vmax
      background-image url(../statics/trackit.png)
      background-position center
      background-size contain
      background-repeat no-repeat
      background-color #333
      color rgba(255,255,255,0.7)
      overflow hidden
    .error-card
      border-radius 2px
      margin-top -50px
      width 80vw
      max-width 600px
      padding 25px
      > i
        font-size 5rem
  .modal-date
    .q-dialog__inner--minimized
      padding 6px
</style>
