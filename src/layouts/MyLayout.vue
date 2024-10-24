<template>
  <q-layout ref="layout" view="hHh LpR lFf" @click.stop="layoutCkickHandler">
    <q-drawer persistent
      id="left-drawer"
      v-if="isInit && needShowList"
      v-model="devicesListSettings.opened"
      side="left"
      :no-swipe-open="$q.platform.is.desktop"
      :no-swipe-close="$q.platform.is.desktop"
      :breakpoint="576"
      :overlay="!devicesListSettings.pinned">
      <device-list
        v-show="devices.length"
        :selectedDeviceId="selectedDevice.id"
        :isFollowed="selectedDevice.follow"
        :activeDevicesID="activeDevicesID"
        :devices="devices"
        :devicesColors="devicesColors"
        :devicesListPinned="devicesListSettings.pinned"
        @select-device="selectDeviceInListHandler"
        @follow-selected-device="followSelectedDeviceHandler"
        @device-in-devices-list-ckick="deviceInListClickHandler"
        @click-hide="devicesListOpenedHandler(false)"
        @devices-list-pinned="devicesListPinnedHandler"
        @update-color="updateColorHandler"/>
    </q-drawer>
    <q-drawer no-swipe-open no-swipe-close
      v-if="needShowTelemetry"
      v-model="telemetrySettings.opened"
      side="right"
      :content-class="{'bg-grey-9':telemetrySettings.inverted}">
      <div style="position: relative; height: 100dvh; overflow: hidden;">
        <q-item>
          <q-item-section avatar>
            <q-btn flat round small
              icon="mdi-chevron-right"
              :color="telemetrySettings.inverted ? 'white' : ''"
              @click="telemetryButtonClickHandler"/>
          </q-item-section>
          <q-item-section>
            <q-item-label header
              class="ellipsis text-bold q-pa-none"
              style="font-size: 1.3rem"
              :class="{'text-white': telemetrySettings.inverted}">
              Telemetry
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn round flat
              icon="mdi-image-filter-black-white"
              class="text-grey"
              :color="telemetrySettings.inverted ? 'white' : 'grey'"
              @click="telemetryInvertedHandler">
              <q-tooltip>Inverted</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
        <q-item style="border-top: 1px solid #ddd; min-height: 71px;" v-if="deviceIdForTelemetry">
          <div
            class="text-center absolute-top-left bg-grey-4 text-bold text-grey-9"
            style="font-size:10px;min-width:55px;padding:0 3px;z-index:1;border-radius:0 0 3px 0;">
            #{{deviceForTelemetry.id}}
          </div>
          <q-item-section side :class="{'text-grey-4': telemetrySettings.inverted}">
            <q-icon
              size="1.7rem"
              name="mdi-developer-board"/>
          </q-item-section>
          <q-item-section>
            <q-item-label class="ellipsis q-pa-none" :class="{'text-grey-4': telemetrySettings.inverted}" header>{{deviceForTelemetry.name || '&lt;noname&gt;'}}
              <q-tooltip>{{deviceForTelemetry.name || '&lt;noname&gt;'}}</q-tooltip>
            </q-item-label>
            <q-item-label class="ellipsis" :class="{'text-grey-4': telemetrySettings.inverted}" caption>
              <q-icon name="mdi-label-outline" /> {{deviceForTelemetry.configuration && deviceForTelemetry.configuration.ident ? deviceForTelemetry.configuration.ident : '&lt;no ident&gt;'}}
            </q-item-label>
            <q-item-label v-if="deviceForTelemetry.configuration && deviceForTelemetry.configuration.phone" :class="{'text-grey-4': telemetrySettings.inverted}" caption>
              <q-icon name="mdi-phone" /> {{deviceForTelemetry.configuration && deviceForTelemetry.configuration.phone ? deviceForTelemetry.configuration.phone : '&lt;no phone&gt;'}}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else>
          <q-item-label header
            class="ellipsis text-bold"
            :class="{'text-white': telemetrySettings.inverted}"
            style="width: 100%; text-align: center">
            No selected device
          </q-item-label>
        </q-item>
        <q-item v-if="deviceIdForTelemetry">
          <q-item-section>
            <q-input dense outlined hide-bottom-space
              type="text"
              label="Search"
              :value="telemetrySearch"
              :dark="telemetrySettings.inverted"
              :color="telemetrySettings.inverted ? 'white' : 'grey'"
              class="q-mb-xs"
              @input= "val => { telemetrySearch = val.toLowerCase() }"/>
          </q-item-section>
        </q-item>
        <q-telemetry class="scroll" style="height: calc(100% - 128px)" v-if="deviceIdForTelemetry" :propHistoryFlag="telemetryConfig.propHistoryFlag" :device="deviceForTelemetry" :inverted="telemetrySettings.inverted" :search="telemetrySearch" />
      </div>
    </q-drawer>
    <q-page-container>
      <q-page>
        <q-btn small round flat
          v-if="devices.length && needShowList"
          color="bg-grey-9"
          size="md"
          class="floated menu white-background"
          icon="mdi-menu"
          @click.stop="devicesListOpenedHandler(!devicesListSettings.opened)"/>
        <div class="floated label">
          <img src="track-it-logo.png" alt="Track it!" style="height: 40px; margin-top: 3px; display: inline-block">
          <div class="q-toolbar-title" style="color: rgb(51, 51, 51); display: inline-block">
            Track it! <sup>{{version}}</sup>
            <div class="q-toolbar-subtitle">
              Find yourself
            </div>
          </div>
        </div>
        <q-btn v-if="errors.length" @click="clearNotificationCounter" small flat round color="bg-grey-9" size="md" icon="mdi-bell" class="floated notifications white-background">
          <q-chip v-if="newNotificationCounter" color="red" class="absolute-top-right q-pa-xs text-white" style="font-size: .6rem;">{{newNotificationCounter}}</q-chip>
          <q-menu fit ref="popoverError">
            <q-list no-border style="max-height: 200px" link separator class="scroll">
              <q-item
                v-for="(error, index) in errors"
                :key="index"
                style="cursor: default">
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
            <q-btn
              icon="mdi-menu"
              style="pointer-events: auto"
              color="black"
              size="md"
              @click.stop="devicesListOpenedHandler(!devicesListSettings.opened)">
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
        <a v-if="$q.platform.is.desktop" href="https://github.com/flespi-software/TrackIt/" target="_blank">
          <q-btn flat round
            color="bg-grey-9"
            :class="[needShowTelemetry ? 'github' : 'telemetry']"
            class="floated white-background">
            <img style="height: 30px;" src="GitHub-Mark-32px.png" alt="GitHub">
            <q-tooltip>Show on GitHub</q-tooltip>
          </q-btn>
        </a>
        <q-btn small round flat
          v-if="needShowTelemetry"
          size="md"
          icon="mdi-list-box-outline"
          class="floated telemetry white-background"
          @click="telemetryButtonClickHandler">
          <q-tooltip>Device telemetry</q-tooltip>
        </q-btn>
        <q-btn small round flat
          size="md"
          icon="mdi-dots-vertical"
          class="floated options white-background"
          color="bg-grey-9">
          <q-menu ref="popover-menu">
            <q-list link separator class="scroll" style="min-width: 200px">
              <q-item dense v-if="!needHideMessagesInMenu">
                <q-toggle @input="paramsChangeHandler" :disabled="!devices.length" v-model="params.needShowMessages" icon="mdi-mail" label="Messages">
                  <q-tooltip>Show messages grid</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item dense v-if="!needHidePlayerInMenu">
                <q-toggle @input="paramsChangeHandler" :disable="!devices.length"  v-model="params.needShowPlayer" icon="mdi-play" label="Player">
                  <q-tooltip>Show track player</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item dense v-if="!needHideNamesInMenu">
                <q-toggle @input="paramsChangeHandler" :disabled="!devices.length" v-model="params.needShowNamesOnMap" icon="mdi-map-marker-radius-outline" label="Names">
                  <q-tooltip>Display cars' names on the map</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item dense v-if="!needHideInvalidInMenu">
                <q-toggle  @input="paramsChangeHandler" :disabled="!devices.length" v-model="params.needShowInvalidPositionMessages" icon="mdi-map-marker-off" label="Drow invalid">
                  <q-tooltip>Use messages with position.valid=false to display cars' positions on the map</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item class="within-iframe-hide" @click="exitHandler" clickable>
                <q-item-section avatar class="q-pl-md">
                  <q-icon name="mdi-exit-to-app" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Exit</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <map-component
          :activeDevices="activeDevices"
          :devicesColors="computedDevicesColors"
          :selectedDeviceId="selectedDevice.id"
          :isSelectedDeviceFollowed="selectedDevice.follow"
          :params="params"
          :date="date"
          @change-need-show-messages="(value) => { params.needShowMessages = value }"
          @update-telemetry-device-id="updateTelemetryDeviceId"
          @queue-created="queueCreatedHandler"
          @update-color="updateColorHandler"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import Vue from 'vue'
import { mapState, mapMutations, mapActions } from 'vuex'
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
      selectedDevice: {
        id: null,
        follow: false
      },
      devicesColors: {},
      deviceIdForTelemetry: null,
      needShowList: true,
      needShowTelemetry: true,
      needHideNamesInMenu: false,
      needHidePlayerInMenu: false,
      needHideMessagesInMenu: false,
      needHideInvalidInMenu: false,
      params: {
        needShowMessages: false,
        needShowInvalidPositionMessages: false,
        needShowNamesOnMap: true,
        needShowPlayer: true
      },
      devicesListSettings: {
        opened: false,      // current status of the left drawer: opened/closed
        pinned: false       // state of the left drawer: is it pinned (to prevent automatical closing) or not
      },
      telemetrySettings: {
        inverted: true,
        opened: false
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
    computedDevicesColors () {
      /* this is a computed devicesColor property, needed in order to have old and new values in devicesColors watcher in map component */
      return Object.assign({}, this.devicesColors)
    },
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
    layoutCkickHandler (event) {
      /* will close left drawer if user clicked outside the drawer */
      /* this immitates mobile behavior - automatic closing of the left drawer if it isn't pinned */
      if (!this.devicesListSettings.opened) {
        /* left drawer is already closed, nothing to do here */
        return
      }
      if (!event.target.closest('#left-drawer') && !this.devicesListSettings.pinned) {
        /* click outside of the unpinned left drawer - close it */
        this.devicesListOpenedHandler(false)
      }
    },
    devicesListPinnedHandler (pinned) {
      /* 'device-list-pinned' event handler */
      /* the event is generated by pin button inside DeviceList component */
      this.devicesListSettings.pinned = pinned
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'devicesListSettings', value: this.devicesListSettings })
    },
    updateColorHandler (id, color) {
      /* update device's color using vue set to ensure devicesColors vue property's reactivity */
      this.$set(this.devicesColors, id, color)
      /* sync updated colors to localstorage */
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'colors', value: this.devicesColors })
    },
    devicesListOpenedHandler (state) {
      /* open-close the left drawer handler */
      this.devicesListSettings.opened = state
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'devicesListSettings', value: this.devicesListSettings })
    },
    updateSelectedDevice (id, follow) {
      /* update selected device id and and its follow property */
      this.selectedDevice.id = id
      if (follow !== undefined) {
        /* if follow property is given explicitly - then update selected device and sync to localstorage */
        this.selectedDevice.follow = follow
        setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'selected', value: this.selectedDevice })
        return false
      }

      /* if follow property is not given - try to get it from localstorage */
      const storedSelectedDevice = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'selected'})
      if (!storedSelectedDevice || !storedSelectedDevice.id || storedSelectedDevice.id !== id || storedSelectedDevice.follow == undefined) {
        /* no such property in the localstorage - set it to false and save to localstorage  */
        this.selectedDevice.follow = false
        setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'selected', value: this.selectedDevice })
        return false
      }

      /* just init follow property of the given device from localstorage */
      this.selectedDevice.follow = storedSelectedDevice.follow
    },
    selectDeviceInListHandler (id) {
      /* user clicked 'Show on map' button for this device in the devices list (in the left drawer) */
      if (id) {
        this.updateTelemetryDeviceId(id)
        this.updateSelectedDevice(id, true)
      }
      if (this.$q.platform.is.mobile || !this.devicesListSettings.pinned) {
        /* close devices list when device is selected, unless left drawer is pinned */
        this.devicesListOpenedHandler(false)
      }
    },
    followSelectedDeviceHandler (state) {
      this.updateSelectedDevice(this.selectedDevice.id, state)
    },
    deviceInListClickHandler () {
      if (this.$q.platform.is.mobile || !this.devicesListSettings.pinned) {
        /* close devices list when device is selected, unless left drawer is pinned */
        this.devicesListOpenedHandler(false)
      }
    },
    paramsChangeHandler (val) {
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'params', value: this.params })
    },
    telemetryButtonClickHandler() {
      /* right drawer with telemetry open/close handler */
      this.$set(this.telemetrySettings, 'opened', !this.telemetrySettings.opened)
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'telemetrySettings', value: this.telemetrySettings })
    },
    telemetryInvertedHandler () {
      /* telemetry inverted button handler*/
      this.$set(this.telemetrySettings, 'inverted', !this.telemetrySettings.inverted)
      setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'telemetrySettings', value: this.telemetrySettings })
    },
    updateTelemetryDeviceId (id) {
      const devicesById = this.devices.filter(device => device.id === id)
      if (devicesById.length) {
        this.deviceIdForTelemetry = id
        this.updateSelectedDevice(id)
        if (this.telemetrySettings.opened && this.deviceIdForTelemetry && this.activeDevicesID.includes(this.deviceIdForTelemetry)) {
          setTimeout(() => {
            if (id === this.selectedDevice.id && this.$q.platform.is.mobile) {
              return false
            }
          }, 0)
        }
      } else {
        this.deviceIdForTelemetry = null
      }
    },
    queueCreatedHandler () {
      // assign selected device
      const storedSelectedDevice = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'selected'})
      if (storedSelectedDevice && storedSelectedDevice.id && this.activeDevicesID.length && this.activeDevicesID.includes(storedSelectedDevice.id)) {
        // selected device is loaded from local storage and it's among the active devices
        this.selectedDevice.id = storedSelectedDevice.id
        this.selectedDevice.follow = storedSelectedDevice.follow ? storedSelectedDevice.follow : false
      } else {
        // there is no selected device in the local storage or selected device loaded from local storage is not in the list of current active devices
        // assign the first device from the list of active devices as selected device
        if (this.activeDevicesID.length) {
          this.updateSelectedDevice(this.activeDevicesID[0], false)
        }
      }
    },
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY')
    },
    initUserSelectionsFromLS () {
      /* init drop-down menu params from local storage */
      const params = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'params' })
      if (params) {
        this.$set(this, 'params', Object.assign(this.params, params))
      }
      /* init right drawer (telemetry) settings from localstorage */
      const telemetrySettings = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'telemetrySettings' })
      if (telemetrySettings) {
        this.$set(this, 'telemetrySettings', Object.assign(this.telemetrySettings, telemetrySettings))
      }
      /* init left drawer (devices list) settings from localstorage */
      const devicesListSettings = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'devicesListSettings' })
      if (devicesListSettings) {
        this.$set(this, 'devicesListSettings', Object.assign(this.devicesListSettings, devicesListSettings))
      }
      /* load device's colors from localstorage and set to devicesColors vue property */
      let devicesColorsLS = getFromStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'colors' })
      if (!devicesColorsLS) {
        /* init colors object in localstorage, if not yet */
        devicesColorsLS = {}
        setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'colors', value: devicesColorsLS })
      }
      /* ensure that all active devices have assigned colors, synced to localstorage */
      const letters = '0123456789ABCDEF'
      this.activeDevicesID.forEach(id => {
        if (!devicesColorsLS[id]) {
          let color = `#${letters[Math.floor(Math.random() * 5)]}`
          for (let i = 0; i < 5; i++) {
            color += letters[Math.floor(Math.random() * 15)]
          }
          devicesColorsLS[id] = color
          setToStore({ store: this.$q.localStorage, storeName: this.$store.state.storeName, name: 'colors', value: devicesColorsLS })
        }
      })
      /* now copy colors loaded from localstorage to the devicesColors vue property */
      Object.keys(devicesColorsLS).forEach(id => {
        /* use vue set to ensure devicesColors vue property's reactivity */
        this.$set(this.devicesColors, id, devicesColorsLS[id])
      });
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
        player = this.$route.query.player || getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'player' }),
        messages = this.$route.query.messages || getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'messages' }),
        invalid = this.$route.query.invalid || getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'invalid' }),
        telemetry = this.$route.query.telemetry || getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'telemetry' }),
        devices = this.$route.params.devices
      if (from && to) {
        this.date = [from * 1000, to * 1000]
      } else if (!this.date[0] && !this.date[1]) {
        this.initDate()
      }
      if (hidelist) {
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'hidelist', value: hidelist })
        this.needShowList = hidelist === 'true' ? false : true
      }
      if (telemetry) {
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'telemetry', value: telemetry })
        this.needShowTelemetry = telemetry === 'false' ? false : true
      }
      if (names) {
        this.needHideNamesInMenu = true
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'names', value: names })
        if (names === 'true') {
          this.$set(this.params, 'needShowNamesOnMap', true)
        } else if (names === 'false') {
          this.$set(this.params, 'needShowNamesOnMap', false)
        }
        this.paramsChangeHandler()
      }
      if (player) {
        this.needHidePlayerInMenu = true
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'player', value: player })
        if (player === 'true') {
          this.$set(this.params, 'needShowPlayer', true)
        } else if (player === 'false') {
          this.$set(this.params, 'needShowPlayer', false)
        }
        this.paramsChangeHandler()
      }
      if (messages) {
        this.needHideMessagesInMenu = true
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'messages', value: messages })
        if (messages === 'true') {
          this.$set(this.params, 'needShowMessages', true)
        } else if (messages === 'false') {
          this.$set(this.params, 'needShowMessages', false)
        }
        this.paramsChangeHandler()
      }
      if (invalid) {
        this.needHideInvalidInMenu = true
        setToStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'invalid', value: invalid })
        if (invalid === 'true') {
          this.$set(this.params, 'needShowInvalidPositionMessages', true)
        } else if (invalid === 'false') {
          this.$set(this.params, 'needShowInvalidPositionMessages', false)
        }
        this.paramsChangeHandler()
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
      } else {
        this.$q.loading.show()
      }
    },
    activeDevicesID (newVal) {
      if (!newVal.length) {
        /* the last device was unset, and there are no active devices left */
        this.deviceIdForTelemetry = null
        this.updateSelectedDevice(null, false)
      } else if (!newVal.includes(this.selectedDevice.id)) {
        /* selected device was removed from the list */
        /* select new device from the active devices - the next one, if exists, the last one - otherwise */
        const sorted = newVal.toSorted((a, b) => {return a-b})
        let index = sorted.length - 1
        const nextIndex = sorted.findIndex((id) => {return id > this.selectedDevice.id})
        if (nextIndex > 0) {
          index = nextIndex
        }
        this.updateTelemetryDeviceId(sorted[index])
      }
    },
    devices (devices, prev) {
      if (!devices.length) {
        this.telemetrySettings.opened = false
      }
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
    }
    this.initUserSelectionsFromLS()
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
      right 100px
    &.telemetry
      top 5px
      right 55px
    &.notifications
      top 5px
      right 145px
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
    &.white-background
      background rgba(255,255,255,0.3)
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
