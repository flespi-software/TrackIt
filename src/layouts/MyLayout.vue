<template>
  <q-layout ref="layout" view="hHh LpR lFf">
    <q-drawer v-if="isInit && needShowList" side="left" :no-swipe-open="$q.platform.is.desktop" :no-swipe-close="$q.platform.is.desktop" v-model="side_left" :breakpoint="576" behavior="mobile">
      <device-list v-show="devices.length" @update-watch-by-id="setWatchToDeviceID" :deviceIdForWatch="deviceIdForWatch" :activeDevicesID="activeDevicesID" :devices="devices" @click-hide="side_left = false"/>
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
            <q-input type="text" label="Search" v-model="telemetrySearch" :dark="telemetrySettings.inverted" :color="telemetrySettings.inverted ? 'white' : 'grey'" outlined hide-bottom-space class="q-mb-xs"/>
          </q-item-section>
        </q-item>
        <q-telemetry class="scroll" style="height: calc(100% - 128px)" v-if="deviceIdForTelemetry" :propHistoryFlag="telemetryConfig.propHistoryFlag" :device="deviceForTelemetry" :inverted="telemetrySettings.inverted" :search="telemetrySearch" />
        <div v-else class="text-bold text-center q-mt-sm" :class="{'text-white': telemetrySettings.inverted}">
          Select one by clicking on its <q-icon name="mdi-car-sports" size="1.2rem"/> marker
        </div>
      </div>
    </q-drawer>
    <q-page-container>
      <q-page>
        <q-btn @click="side_left = !side_left" small round flat color="bg-grey-9" size="md" v-if="devices.length && needShowList" class="floated menu">
          <q-icon name="menu" />
        </q-btn>
        <div class="floated label">
          <img src="track-it-logo.png" alt="Track it!" style="height: 40px; margin-top: 3px; display: inline-block">
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
        <div v-if="devices.length" class="floated date">
          <date-range-modal
            :date="date"
            :theme="dateTheme"
            @save="dateRange => date = [...dateRange]"
            @reinit="initDate"
          />
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
        <a v-if="$q.platform.is.desktop" href="https://github.com/flespi-software/TrackIt/" class="floated github" target="_blank"><q-btn flat round color="bg-grey-9"><img style="height: 30px;" src="GitHub-Mark-32px.png" alt="GitHub"><q-tooltip>Show on GitHub</q-tooltip></q-btn></a>
        <q-btn small round flat size="md" class="floated options">
          <q-icon color="bg-grey-9" name="more_vert" />
          <q-menu ref="popover-menu">
            <q-list link separator class="scroll" style="min-width: 200px">
              <q-item>
                <q-toggle @input="menuChangeHandler" :disabled="!devices.length" v-model="params.needShowMessages" icon="dvr" label="Messages" />
              </q-item>
              <q-item>
                <q-toggle @input="menuChangeHandler" v-model="params.needShowPlayer" :disable="!devices.length" icon="mdi-play" label="Player" />
              </q-item>
              <q-item>
                <q-toggle v-close-popup @input="menuChangeHandler" :disabled="!devices.length" v-model="params.needShowTelemetry" icon="av_timer" label="Telemetry" />
              </q-item>
              <q-item v-if="!needHideNamesInMenu">
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
          @update-telemetry-device-id="updateTelemetryDeviceId"
          :activeDevices="activeDevices"
          :deviceIdForWatch="deviceIdForWatch"
          :params="params"
          :date="date"
          @change-need-show-messages="(value) => { params.needShowMessages = value }"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import Vue from 'vue'
import { mapState, mapMutations, mapActions } from 'vuex'
// import { VueFlatPickr } from 'datetimerangepicker'
import DateRangeModal from '../components/DateRangeModal'
import { QTelemetry, telemetryVuexModule } from 'qtelemetry'
import MapComponent from '../components/Map.vue'
import DeviceList from '../components/DeviceList.vue'
import dist from '../../package.json'
import { openURL, date } from 'quasar'
import { getFromStore, setToStore } from '../mixins/store'

export default {
  data () {
    return {
      deviceIdForWatch: null,
      deviceIdForTelemetry: null,
      needShowList: true,
      needHideNamesInMenu: false,
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
      telemetrySearch: '',
      telemetryConfig: {
        propHistoryFlag: true
      },
      version: dist.version,
      dateTheme: {
        color: 'white',
        bgColor: 'grey-9',
        modeSwitch: false
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
        return state.activeDevicesID
      },
      hasDevicesInit: state => state.hasDevicesInit,
      activeDevices: state => state.devices.filter(device => state.activeDevicesID.includes(device.id)),
      lastActiveDevicesUpdate (state) {
        return this.activeDevicesID.reduce((result, id) => {
          const messages = state.messages[id].messages.filter((message) => {
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
    }),
    date: {
      get () { return this.$store.state.date },
      set (date) {
        this.$store.commit('setDate', date)
      }
    }
  },
  components: {
    DeviceList,
    MapComponent,
    QTelemetry,
    DateRangeModal
  },
  methods: {
    openURL,
    ...mapMutations([
      'clearToken',
      'clearCurrentRegion',
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
      this.clearCurrentRegion()
      this.$router.push('/login')
    },
    setWatchToDeviceID (id) {
      this.updateTelemetryDeviceId(id)
      this.deviceIdForWatch = id
    },
    menuChangeHandler (val) {
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'params', value: this.params })
    },
    telemetrySettingsChangeHandler () {
      this.$set(this.telemetrySettings, 'inverted', !this.telemetrySettings.inverted)
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'telemertySettings', value: this.telemetrySettings })
    },
    updateTelemetryDeviceId (id) {
      if (this.deviceIdForTelemetry === id) {
        this.setWatchToDeviceID(null)
        return false
      }
      const devicesById = this.devices.filter(device => device.id === id)
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
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY')
    },
    paramsProcess () {
      const params = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'params' })
      if (params) {
        this.$set(this, 'params', Object.assign(this.params, params))
        this.side_right = params.needShowTelemetry
      }
      const telemetrySettings = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'telemetrySettings' })
      if (telemetrySettings) {
        this.$set(this, 'telemetrySettings', Object.assign(this.telemetrySettings, telemetrySettings))
      }
    },
    connectProcess () {
      if (!this.isInit) {
        Vue.connector.socket.on('connect', () => {
          this.isInit = true
          this.$q.loading.hide()
        })
        this.$q.loading.show()
      }
    },
    initDate () {
      this.getLastUpdatePosition()
        .then((date) => {
          this.date = date
        })
    },
    routeProcess () {
      const from = this.$route.query.from,
        to = this.$route.query.to,
        hidelist = this.$route.query.hidelist || getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'hidelist' }),
        names = this.$route.query.names || getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'names' }),
        devices = this.$route.params.devices
      if (from && to) {
        this.date = [from * 1000, to * 1000]
      } else if (!this.date[0] && !this.date[1]) {
        this.initDate()
      }
      if (hidelist) {
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'hidelist', value: hidelist })
        this.needShowList = false
      }
      if (names) {
        this.needHideNamesInMenu = true
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'names', value: names })
        if (names === 'true') {
          this.$set(this.params, 'needShowNamesOnMap', true)
        } else if (names === 'false') {
          this.$set(this.params, 'needShowNamesOnMap', false)
        }
        this.menuChangeHandler()
      }
      if (devices) {
        const active = devices.split(',').map(id => +id)
        active.forEach((id) => { this.setActiveDevice(id) })
      }
    },
    loginProcess () {
      if (this.$route.params.token) {
        this.$router.push(`/login/${this.$route.params.token}`)
      } else {
        this.$router.push('/login')
      }
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
    if (!this.$store.state.telemetry) {
      this.$store.registerModule('telemetry', telemetryVuexModule(this.$store, Vue))
    }
    this.clearNotificationCounter()
    this.clearErrors()
    this.routeProcess()
    if (!this.token) {
      this.loginProcess()
      return false
    }
    this.connectProcess()
    this.poolDevices().then(callback => { this.unsubscribeDevices = callback })
    if (this.activeDevicesID.length) {
      this.$router.push(`/devices/${this.activeDevicesID.join(',')}`)
      // watching current device if it one
      if (this.activeDevicesID.length === 1) {
        this.deviceIdForWatch = this.activeDevicesID[0]
      }
    }
    this.paramsProcess()
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
    &.date
      top 60px
      right 10px
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
      background-image url(../../public/trackit.png)
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
