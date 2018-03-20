<template>
  <q-layout ref="layout" view="hHh LpR lFf">
    <q-layout-header v-if="devices.length">
      <q-toolbar color="dark">
        <q-btn flat @click="side_left = !side_left">
          <q-icon name="menu" />
        </q-btn>
        <img src="statics/track-it-logo.png" alt="Track it!" style="height: 40px">
        <q-toolbar-title>
          Track it! <sup>{{version}}</sup>
          <span slot="subtitle">Find yourself</span>
        </q-toolbar-title>
        <a href="https://github.com/flespi-software/TrackIt/" target="_blank"><q-btn flat color="dark"><img style="height: 30px;" src="../statics/GitHub-Mark-Light-32px.png" alt="GitHub"><q-tooltip>Show on GitHub</q-tooltip></q-btn></a>
        <q-btn flat>
          <q-icon color="white" name="more_vert" />
          <q-popover ref="popover-menu">
            <q-list link separator class="scroll" style="min-width: 200px">
              <q-item>
                <q-toggle @input="menuChangeHandler" v-model="params.needShowMessages" icon="dvr" label="Messages" />
              </q-item>
              <q-item>
                <q-toggle @input="menuChangeHandler" v-model="params.needShowTelemetry" icon="av_timer" label="Telemetry" />
              </q-item>
              <q-item>
                <q-toggle @input="menuChangeHandler" v-model="params.needShowNamesOnMap" icon="pin_drop" label="Names" />
              </q-item>
              <q-item @click.native="exitHandler">
                <q-item-side icon="exit_to_app"/>
                <q-item-main>
                  <q-item-tile label>Exit</q-item-tile>
                </q-item-main>
              </q-item>
            </q-list>
          </q-popover>
        </q-btn>
      </q-toolbar>
    </q-layout-header>
    <q-layout-drawer side="left" v-model="side_left" :breakpoint="576">
      <device-list v-show="devices.length" @update:watch-by-id="setWatchToDeviceID" :deviceIdForWatch="deviceIdForWatch" :activeDevicesID="activeDevicesID" :devices="devices" @click:hide="side_left = false"/>
    </q-layout-drawer>
    <q-layout-drawer side="right" :content-class="{'bg-dark':telemetrySettings.inverted}" v-model="side_right">
      <div v-if="params.needShowTelemetry && deviceIdForTelemetry && activeDevicesID.includes(deviceIdForTelemetry)">
        <q-item>
          <q-item-side left><q-icon :color="telemetrySettings.inverted ? 'white' : ''" size="1.8rem" name="developer_board"/></q-item-side>
          <q-item-main>
            <q-item-tile label class="ellipsis text-bold" :class="{'text-white': telemetrySettings.inverted}">Telemetry</q-item-tile>
            <q-item-tile sublabel class="ellipsis" :class="{'text-white': telemetrySettings.inverted}"><small>{{deviceForTelemetry.name || `#${deviceForTelemetry.id}`}}</small></q-item-tile>
          </q-item-main>
          <q-item-side right>
            <q-checkbox  @change="telemetrySettingsChangeHandler" v-model="telemetrySettings.inverted" checked-icon="filter_b_and_w" unchecked-icon="filter_b_and_w" :color="telemetrySettings.inverted ? 'white' : 'grey'" class="text-grey">
              <q-tooltip>Inverted</q-tooltip>
            </q-checkbox>
          </q-item-side>
          <q-item-side right><q-icon :color="telemetrySettings.inverted ? 'white' : ''" class="pull-right cursor-pointer" name="arrow_forward" @click.native="side_right = false, deviceIdForTelemetry = 0" size="1.8rem"></q-icon></q-item-side>
        </q-item>
        <q-item>
          <q-item-main>
            <q-input type="text" float-label="Search" v-model="telemetrySearch" :inverted="telemetrySettings.inverted" :color="telemetrySettings.inverted ? 'none': ''" />
          </q-item-main>
        </q-item>
        <q-telemetry :propHistoryFlag="telemetryConfig.propHistoryFlag" :device="deviceForTelemetry" :inverted="telemetrySettings.inverted" :search="telemetrySearch" />
      </div>
    </q-layout-drawer>
    <q-page-container>
      <q-page>
        <map-component @update:telemetry-device-id="updateTelemetryDeviceId" :activeDevices="activeDevices" :deviceIdForWatch="deviceIdForWatch" :params="params" v-if="devices.length"></map-component>
        <div class="error-page bg-light column items-center no-wrap" v-if="!devices.length && hasDevicesInit">
          <a v-if="!$q.platform.is.mobile" href="https://github.com/flespi-software/TrackIt/" target="_blank"><img style="position: absolute; top: 0; right: 0; border: 0; width: 149px; height: 149px;" src="../statics/right-graphite@2x.png" alt="Fork me on GitHub"></a>
          <div class="error-code flex items-center justify-center">
            Track It!
          </div>
          <div>
            <div class="error-card shadow-4 bg-white column items-center justify-center no-wrap">
              <p class="text-center group">
                <q-btn color="dark" @click="exitHandler" icon-right="exit_to_app">Logout</q-btn>
              </p>
              <q-icon name="error_outline" color="grey-5" />
              <p class="caption text-center">Devices not found.</p>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import QTelemetry from 'qtelemetry'
import MapComponent from '../components/Map.vue'
import DeviceList from '../components/DeviceList.vue'
import dist from '../../package.json'

export default {
  data () {
    return {
      deviceIdForWatch: null,
      deviceIdForTelemetry: null,
      params: {
        needShowMessages: false,
        needShowTelemetry: true,
        needShowNamesOnMap: true
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
      version: dist.version
    }
  },
  computed: {
    ...mapState({
      token: (state) => state.token,
      devices: (state) => state.devices,
      activeDevicesID: (state) => state.activeDevicesID,
      hasDevicesInit: state => state.hasDevicesInit
    }),
    activeDevices () {
      return this.$store.state.devices.filter(device => this.$store.state.activeDevicesID.includes(device.id))
    },
    deviceForTelemetry () {
      return this.deviceIdForTelemetry ? this.devices.filter(device => device.id === this.deviceIdForTelemetry)[0] : {}
    }
  },
  components: {
    DeviceList,
    MapComponent,
    QTelemetry
  },
  methods: {
    ...mapMutations([
      'setToken',
      'clearToken',
      'setDevicesInit',
      'unsetDevicesInit'
    ]),
    exitHandler (e) {
      this.unsetDevicesInit()
      this.clearToken()
      this.$router.push('/login')
    },
    setWatchToDeviceID (id) {
      this.deviceIdForWatch = id
    },
    menuChangeHandler (val) {
      this.$q.localStorage.set('TrackIt Params', this.params)
    },
    telemetrySettingsChangeHandler () {
      this.$q.localStorage.set('TrackIt TelemetrySettings', this.telemetrySettings)
    },
    updateTelemetryDeviceId (id) {
      let devicesById = this.devices.filter(device => device.id === id)
      if (devicesById.length) {
        this.deviceIdForTelemetry = id
        if (this.params.needShowTelemetry && this.deviceIdForTelemetry && this.activeDevicesID.includes(this.deviceIdForTelemetry)) {
          setTimeout(() => { this.side_right = true }, 0)
        }
      } else {
        this.deviceIdForTelemetry = null
        this.side_right = false
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
        if (this.devices.length) {
          this.side_left = true
        }
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
      } else if (devices.length && !prev.length) {
        this.side_left = true
      }
    }
  },
  created () {
    if (!this.token) {
      this.$router.push('/login')
    }
    let params = this.$q.localStorage.get.item('TrackIt Params')
    if (params) {
      this.params = Object.assign(this.params, params)
    }
    let telemetrySettings = this.$q.localStorage.get.item('TrackIt TelemetrySettings')
    if (telemetrySettings) {
      this.telemetrySettings = Object.assign(this.telemetrySettings, telemetrySettings)
    }
  }
}
</script>

<style lang="stylus">
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
</style>
