<template>
  <q-layout ref="layout" view="hHh LpR lFf" @click.stop="layoutCkickHandler">
    <q-drawer
      persistent
      id="left-drawer"
      v-if="needShowList && devicesInitialized && devices.length"
      v-model="devicesListSettings.opened"
      side="left"
      :no-swipe-open="$q.platform.is.desktop"
      :no-swipe-close="$q.platform.is.desktop"
      :breakpoint="576"
      :overlay="!devicesListSettings.pinned"
    >
      <devices-list
        v-show="devices.length"
        :activeDevicesIDs="activeDevicesIDs"
        :devices="devices"
        :devicesColors="devicesColors"
        :devicesListPinned="devicesListSettings.pinned"
        :isFollowed="selectedDevice.follow"
        :selectedDeviceId="selectedDevice.id"
        @devices-list-pinned="devicesListPinnedHandler"
        @device-in-list-clicked="deviceInListClickHandler"
        @follow-selected-device="followSelectedDeviceHandler"
        @select-device="selectDeviceInListHandler"
        @click-hide="devicesListOpenedHandler(false)"
      />
    </q-drawer>
    <q-drawer
      no-swipe-open
      no-swipe-close
      v-if="needShowTelemetry"
      v-model="telemetrySettings.opened"
      side="right"
      :class="{ 'bg-grey-9': telemetrySettings.inverted }"
    >
      <div style="position: relative; height: 100dvh; overflow: hidden">
        <q-item>
          <q-item-section avatar>
            <q-btn
              flat
              round
              small
              icon="mdi-chevron-right"
              :color="telemetrySettings.inverted ? 'white' : ''"
              @click="telemetryButtonClickHandler"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label
              header
              class="ellipsis text-bold q-pa-none"
              style="font-size: 1.3rem"
              :class="{ 'text-white': telemetrySettings.inverted }"
            >
              Telemetry
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              round
              flat
              icon="mdi-image-filter-black-white"
              class="text-grey"
              :color="telemetrySettings.inverted ? 'white' : 'grey'"
              @click="telemetryInvertedHandler"
            >
              <q-tooltip>Inverted</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
        <telemetry
          v-if="deviceIdForTelemetryDrawer"
          :deviceId="deviceIdForTelemetryDrawer"
          :inverted="telemetrySettings.inverted"
        />
        <q-item v-else>
          <q-item-label
            header
            class="ellipsis text-bold"
            :class="{ 'text-white': telemetrySettings.inverted }"
            style="width: 100%; text-align: center"
          >
            No selected device
          </q-item-label>
        </q-item>
      </div>
    </q-drawer>
    <q-page-container>
      <q-page>
        <q-btn
          small
          round
          flat
          v-if="devices.length && needShowList"
          color="bg-grey-9"
          size="md"
          class="floated menu white-background"
          icon="mdi-menu"
          @click.stop="devicesListOpenedHandler(!devicesListSettings.opened)"
        />
        <div class="floated label">
          <img
            src="track-it-logo.png"
            alt="Track it!"
            style="height: 40px; margin-top: 3px; display: inline-block"
          />
          <div class="q-toolbar-title" style="color: rgb(51, 51, 51); display: inline-block">
            Track it! <sup>{{ version }}</sup>
            <div class="q-toolbar-subtitle">Find yourself</div>
          </div>
        </div>
        <q-btn
          small
          flat
          round
          v-if="errors.length"
          color="bg-grey-9"
          size="md"
          icon="mdi-bell"
          class="floated notifications white-background"
          @click="resetNewErrorsCounter"
        >
          <q-chip
            v-if="newErrorsCounter"
            color="red"
            class="absolute-top-right q-pa-xs text-white"
            style="font-size: 0.6rem"
            >{{ newErrorsCounter }}</q-chip
          >
          <q-menu fit>
            <q-list no-border link separator style="max-height: 200px" class="scroll">
              <q-item v-for="(error, index) in errors" :key="index" style="cursor: default">
                <q-item-section>
                  <q-item-label>{{ error }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <div v-if="devices.length" class="floated date">
          <date-range-modal
            class="on-left"
            v-model="dateRange"
            :theme="dateTheme"
            @click:customButton="initDateFromTelemetry"
          />
        </div>
        <div v-if="!activeDevicesIDs.length && devices.length" class="floated no-devices">
          <span class="no-devices__message">You have no selected devices</span>
          <div style="margin-top: 15px">
            <q-btn
              icon="mdi-menu"
              style="pointer-events: auto"
              color="black"
              size="md"
              @click.stop="devicesListOpenedHandler(!devicesListSettings.opened)"
            >
              select devices
            </q-btn>
          </div>
        </div>
        <div v-else-if="!devices.length && devicesInitialized" class="floated no-devices">
          <span class="no-devices__message">You have no devices</span>
          <div class="q-mt-sm text-bg-grey-9" style="font-size: 1.3rem">
            Create one on
            <q-btn
              dense
              style="pointer-events: auto"
              @click="openURL('https://flespi.io')"
              color="red-5"
              label="flespi.io"
            />
          </div>
        </div>
        <a
          v-if="$q.platform.is.desktop"
          href="https://github.com/flespi-software/TrackIt/"
          target="_blank"
        >
          <q-btn
            flat
            round
            color="bg-grey-9"
            :class="[needShowTelemetry ? 'github' : 'telemetry']"
            class="floated white-background"
          >
            <img style="height: 30px" src="GitHub-Mark-32px.png" alt="GitHub" />
            <q-tooltip>Show on GitHub</q-tooltip>
          </q-btn>
        </a>
        <q-btn
          small
          round
          flat
          v-if="needShowTelemetry"
          size="md"
          icon="mdi-list-box-outline"
          class="floated telemetry white-background"
          @click="telemetryButtonClickHandler"
        >
          <q-tooltip>Device telemetry</q-tooltip>
        </q-btn>
        <q-btn
          small
          round
          flat
          size="md"
          icon="mdi-dots-vertical"
          class="floated options white-background"
          color="bg-grey-9"
        >
          <q-menu>
            <q-list link separator class="scroll" style="min-width: 200px">
              <q-item dense v-if="!needHideMessagesInMenu">
                <q-toggle
                  v-model="params.needShowMessages"
                  icon="mdi-mail"
                  label="Messages"
                  :disable="!devices.length"
                  @update:model-value="paramsChangeHandler"
                >
                  <q-tooltip>Show messages grid</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item dense v-if="!needHidePlayerInMenu">
                <q-toggle
                  v-model="params.needShowPlayer"
                  icon="mdi-play"
                  label="Player"
                  :disable="!devices.length"
                  @update:model-value="paramsChangeHandler"
                >
                  <q-tooltip>Show track player</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item dense v-if="!needHideNamesInMenu">
                <q-toggle
                  v-model="params.needShowNamesOnMap"
                  icon="mdi-map-marker-radius-outline"
                  label="Names"
                  :disable="!devices.length"
                  @update:model-value="paramsChangeHandler"
                >
                  <q-tooltip>Display cars' names on the map</q-tooltip>
                </q-toggle>
              </q-item>
              <q-item dense v-if="!needHideInvalidInMenu">
                <q-toggle
                  v-model="params.needShowInvalidPositionMessages"
                  icon="mdi-map-marker-off"
                  label="Draw invalid"
                  :disable="!devices.length"
                  @update:model-value="paramsChangeHandler"
                >
                  <q-tooltip
                    >Use messages with position.valid=false to display cars' positions on the
                    map</q-tooltip
                  >
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
        <map-container
          :activeDevices="activeDevices"
          :params="params"
          :selectedDeviceId="selectedDevice.id"
          :isSelectedDeviceFollowed="selectedDevice.follow"
          @change-need-show-messages="
            (value) => {
              params.needShowMessages = value
            }
          "
          @update-telemetry-device-id="updateTelemetryDeviceId"
        />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { DateRangeModal } from 'datetimerangepicker'
import DevicesList from '../components/DevicesList.vue'
import MapContainer from 'src/components/MapContainer.vue'
import Telemetry from 'src/components/Telemetry.vue'
import { useDevicesStore } from 'src/stores/devices'
import { useAuthStore } from 'src/stores/auth'
import { useMiscStore } from 'src/stores/misc'
import { useTelemetryStore } from 'src/stores/telemetry'
import dist from '../../package.json'

export default defineComponent({
  name: 'MainLayout',
  components: {
    DateRangeModal,
    DevicesList,
    MapContainer,
    Telemetry,
  },
  data() {
    return {
      dateTheme: {
        color: 'grey',
        button: {
          closeModal: true,
          icon: 'mdi-map-clock-outline',
          tooltip: 'Reinit time by devices position',
        },
      },
      deviceIdForTelemetryDrawer: 0, // id of the device to be displayed in the right drawer with telemetry
      deviceIdForTelemetrySubscription: 0, // id of the device for which subscription to the telemetry should be created
      devicesListSettings: {
        opened: false, // current status of the left drawer: opened/closed
        pinned: false, // state of the left drawer: is it pinned (to prevent automatical closing) or not
      },
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
        needShowPlayer: true,
      },
      selectedDevice: {
        id: null,
        follow: false,
      },
      telemetrySettings: {
        inverted: true,
        opened: false,
      },
      unsubscribeDevices: () => {},
      version: dist.version,
    }
  },
  computed: {
    ...mapState(useAuthStore, {
      token: (store) => store.token,
      socketConnected: (store) => store.socketConnected,
    }),
    ...mapState(useMiscStore, {
      dateInitialized: (store) => store.dateInitialized,
      errors: (store) => store.errors,
      newErrorsCounter: (store) => store.newErrorsCounter,
    }),
    ...mapState(useDevicesStore, {
      activeDevices: (store) =>
        store.devices.filter((device) => store.activeDevicesIDs.includes(device.id)),
      activeDevicesIDs: (store) => store.activeDevicesIDs,
      devices: (store) => store.devices,
      devicesColors: (store) => store.devicesColors,
      devicesInitialized: (store) => store.devicesInitialized,
    }),
    dateRange: {
      /* date range for DateRangeModal component, mapped to date in from store */
      get() {
        return useMiscStore().date
      },
      set(date) {
        this.setDate(date)
      },
    },
  },
  methods: {
    ...mapActions(useAuthStore, ['clearToken', 'setToken']),
    ...mapActions(useDevicesStore, [
      'getLatestPositionTimestamp',
      'poolDevices',
      'setActiveDevicesIDs',
      'unsetDevicesInitialized',
    ]),
    ...mapActions(useMiscStore, [
      'clearErrors',
      'getFromStore',
      'setDate',
      'setDateInitialized',
      'setToStore',
      'resetNewErrorsCounter',
    ]),
    ...mapActions(useTelemetryStore, ['subscribeDeviceTelemetry', 'unsubscribeDeviceTelemetry']),
    devicesListOpenedHandler(state) {
      /* open-close the left drawer with devices list */
      this.devicesListSettings.opened = state
      this.setToStore({
        store: this.$q.localStorage,
        name: 'devicesListSettings',
        value: this.devicesListSettings,
      })
    },
    deviceInListClickHandler() {
      if (this.$q.platform.is.mobile || !this.devicesListSettings.pinned) {
        /* close devices list when device is selected, unless left drawer is pinned */
        this.devicesListOpenedHandler(false)
      }
    },
    devicesListPinnedHandler(pinned) {
      /* 'device-list-pinned' event handler */
      /* the event is generated by pin button inside DeviceList component */
      this.devicesListSettings.pinned = pinned
      this.setToStore({
        store: this.$q.localStorage,
        name: 'devicesListSettings',
        value: this.devicesListSettings,
      })
    },
    exitHandler() {
      this.$connector.socket.off('error')
      this.unsetDevicesInitialized()
      this.clearToken()
      this.$router.push('/login')
    },
    followSelectedDeviceHandler(state) {
      this.updateSelectedDevice(this.selectedDevice.id, state)
    },
    initDateFromTelemetry() {
      /* init date from the latest available position for active devices */
      this.getLatestPositionTimestamp().then((date) => {
        this.setDate(date)
        this.setDateInitialized()
      })
    },
    initUserSelectionsFromLS() {
      /* init drop-down menu params from local storage */
      const params = this.getFromStore({ store: this.$q.localStorage, name: 'params' })
      if (params) {
        this.params = params
      }
      /* init right drawer (telemetry) settings from localstorage */
      const telemetrySettings = this.getFromStore({
        store: this.$q.localStorage,
        name: 'telemetrySettings',
      })
      if (telemetrySettings) {
        this.telemetrySettings = telemetrySettings
      }
      /* init left drawer (devices list) settings from localstorage */
      const devicesListSettings = this.getFromStore({
        store: this.$q.localStorage,
        name: 'devicesListSettings',
      })
      if (devicesListSettings) {
        this.devicesListSettings = devicesListSettings
      }
    },
    layoutCkickHandler(event) {
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
    loadActiveDevices() {
      /* first try to load active devices from URL params */
      const activeDevicesFromURL = this.$route.params.devices
      if (activeDevicesFromURL) {
        /* create initial list of active devices' ids from url parameters */
        this.setActiveDevicesIDs(activeDevicesFromURL.split(',').map((id) => +id))
        return
      }
      /* if active devices' ids aren't specified in the URL, then try to load active devices from local storage */
      const activeDevicesFromLS = this.getFromStore({ store: this.$q.localStorage, name: 'active' })
      if (activeDevicesFromLS && activeDevicesFromLS.length) {
        this.setActiveDevicesIDs(activeDevicesFromLS)
      }
    },
    processRouteParams() {
      const from = this.$route.query.from,
        to = this.$route.query.to,
        hidelist =
          this.$route.query.hidelist ||
          this.getFromStore({ store: this.$q.sessionStorage, name: 'hidelist' }),
        names =
          this.$route.query.names ||
          this.getFromStore({ store: this.$q.sessionStorage, name: 'names' }),
        player =
          this.$route.query.player ||
          this.getFromStore({ store: this.$q.sessionStorage, name: 'player' }),
        messages =
          this.$route.query.messages ||
          this.getFromStore({ store: this.$q.sessionStorage, name: 'messages' }),
        invalid =
          this.$route.query.invalid ||
          this.getFromStore({ store: this.$q.sessionStorage, name: 'invalid' }),
        telemetry =
          this.$route.query.telemetry ||
          this.getFromStore({ store: this.$q.sessionStorage, name: 'telemetry' })
      if (from && to) {
        /* init date from url parameters, if provided */
        this.setDate([from * 1000, to * 1000])
        this.setDateInitialized()
      }
      if (hidelist) {
        this.setToStore({ store: this.$q.sessionStorage, name: 'hidelist', value: hidelist })
        this.needShowList = hidelist === 'true' ? false : true
      }
      if (telemetry) {
        this.setToStore({ store: this.$q.sessionStorage, name: 'telemetry', value: telemetry })
        this.needShowTelemetry = telemetry === 'false' ? false : true
      }
      if (names) {
        this.needHideNamesInMenu = true
        this.setToStore({ store: this.$q.sessionStorage, name: 'names', value: names })
        if (names === 'true') {
          this.params.needShowNamesOnMap = true
        } else if (names === 'false') {
          this.params.needShowNamesOnMap = false
        }
        this.paramsChangeHandler()
      }
      if (player) {
        this.needHidePlayerInMenu = true
        this.setToStore({ store: this.$q.sessionStorage, name: 'player', value: player })
        if (player === 'true') {
          this.params.needShowPlayer = true
        } else if (player === 'false') {
          this.params.needShowPlayer = false
        }
        this.paramsChangeHandler()
      }
      if (messages) {
        this.needHideMessagesInMenu = true
        this.setToStore({ store: this.$q.sessionStorage, name: 'messages', value: messages })
        if (messages === 'true') {
          this.params.needShowMessages = true
        } else if (messages === 'false') {
          this.params.needShowMessages = false
        }
        this.paramsChangeHandler()
      }
      if (invalid) {
        this.needHideInvalidInMenu = true
        this.setToStore({ store: this.$q.sessionStorage, name: 'invalid', value: invalid })
        if (invalid === 'true') {
          this.params.needShowInvalidPositionMessages = true
        } else if (invalid === 'false') {
          this.params.needShowInvalidPositionMessages = false
        }
        this.paramsChangeHandler()
      }
    },
    queueCreatedHandler() {},
    paramsChangeHandler() {
      /* sync params to local storage */
      this.setToStore({ store: this.$q.localStorage, name: 'params', value: this.params })
    },
    selectDeviceInListHandler(id) {
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
    telemetryButtonClickHandler() {
      /* right drawer with telemetry open/close handler */
      this.telemetrySettings.opened = !this.telemetrySettings.opened
      this.setToStore({
        store: this.$q.localStorage,
        name: 'telemetrySettings',
        value: this.telemetrySettings,
      })
    },
    telemetryInvertedHandler() {
      /* telemetry inverted button handler*/
      this.telemetrySettings.inverted = !this.telemetrySettings.inverted
      this.setToStore({
        store: this.$q.localStorage,
        name: 'telemetrySettings',
        value: this.telemetrySettings,
      })
    },
    updateSelectedDevice(id, follow) {
      /* update selected device id and and its follow property */
      this.selectedDevice.id = id
      if (follow !== undefined) {
        /* if follow property is given explicitly - then update selected device and sync to localstorage */
        this.selectedDevice.follow = follow
        this.setToStore({
          store: this.$q.localStorage,
          name: 'selected',
          value: this.selectedDevice,
        })
        return
      }

      /* if follow property is not given - try to get it from localstorage */
      const storedSelectedDevice = this.getFromStore({
        store: this.$q.localStorage,
        name: 'selected',
      })
      if (
        !storedSelectedDevice ||
        !storedSelectedDevice.id ||
        storedSelectedDevice.id !== id ||
        storedSelectedDevice.follow == undefined
      ) {
        /* no such property in the localstorage - set it to false and save to localstorage  */
        this.selectedDevice.follow = false
        this.setToStore({
          store: this.$q.localStorage,
          name: 'selected',
          value: this.selectedDevice,
        })
        return
      }

      /* just init follow property of the given device from localstorage */
      this.selectedDevice.follow = storedSelectedDevice.follow
    },
    manageTelemetrySubscription(id) {
      if (id === null) {
        return
      }
      if (id === 0) {
        /* all devices are unselected */
        /* unsubscribe from telemetry, if any */
        if (this.deviceIdForTelemetrySubscription !== 0) {
          this.unsubscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
          this.deviceIdForTelemetrySubscription = 0
        }
        return
      }
      const device = useDevicesStore().getDeviceById(id)
      if (device['x-flespi-no-access'] === true) {
        /* this device has no access to messages and to telemetry */
        /* discard telemetry subsctiption, if any */
        if (this.deviceIdForTelemetrySubscription !== 0) {
          this.unsubscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
          this.deviceIdForTelemetrySubscription = 0
        }
        return
      }
      if (device['x-flespi-telemetry-access'] === true) {
        /* this device has no access to messages, but has access to telemetry, and we draw it on map by telemetry */
        /* ensure that we have active telemetry subscription for this device */
        if (this.deviceIdForTelemetrySubscription !== id) {
          if (this.deviceIdForTelemetrySubscription !== 0) {
            this.unsubscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
          }
          this.deviceIdForTelemetrySubscription = id
          this.subscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
        }
        return
      }
      /* this is regular device that is tracked by messages */
      /* subscribe to telemetry only if right drawer is opened */
      if (this.telemetrySettings.opened === true) {
        if (this.deviceIdForTelemetrySubscription !== id) {
          if (this.deviceIdForTelemetrySubscription !== 0) {
            this.unsubscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
          }
          this.deviceIdForTelemetrySubscription = id
          this.subscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
        }
        return
      }
      /* telemetry drawer is closed - unsubscribe from telemetry */
      if (this.deviceIdForTelemetrySubscription !== 0) {
        this.unsubscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
        this.deviceIdForTelemetrySubscription = 0
      }
    },
    updateTelemetryDeviceId(id, follow) {
      if (id === null) {
        return
      }
      this.manageTelemetrySubscription(id)
      this.deviceIdForTelemetryDrawer = !this.telemetrySettings.opened ? 0 : id
      this.updateSelectedDevice(id, follow)
    },
  },
  watch: {
    activeDevicesIDs: {
      deep: true,
      handler(newVal) {
        if (!this.devicesInitialized) {
          return
        }
        if (!newVal.length) {
          /* the last device was unset, and there are no active devices left */
          this.updateTelemetryDeviceId(0)
        } else if (!newVal.includes(this.selectedDevice.id)) {
          /* selected device was removed from the list */
          /* select new device from the active devices - the next one, if exists, the last one - otherwise */
          const sorted = newVal.toSorted((a, b) => {
            return a - b
          })
          let index = sorted.length - 1
          const nextIndex = sorted.findIndex((id) => {
            return id > this.selectedDevice.id
          })
          if (nextIndex > 0) {
            index = nextIndex
          }
          this.updateTelemetryDeviceId(sorted[index])
        }
      },
    },
    devicesInitialized(init) {
      if (!init) { return }
      this.$q.loading.hide()
      if (this.dateInitialized === false) {
        /* if date not yet initialized from the query parameters, then */
        /* init date from the last known positions of active devices */
        this.initDateFromTelemetry()
      }
      // assign selected device
      const storedSelectedDevice = this.getFromStore({
        store: this.$q.localStorage,
        name: 'selected',
      })
      if (
        storedSelectedDevice &&
        storedSelectedDevice.id &&
        this.activeDevicesIDs.length &&
        this.activeDevicesIDs.includes(storedSelectedDevice.id)
      ) {
        // selected device is loaded from local storage and it's among the active devices
        this.selectedDevice.id = storedSelectedDevice.id
        this.selectedDevice.follow = storedSelectedDevice.follow
          ? storedSelectedDevice.follow
          : false
      } else {
        // there is no selected device in the local storage or selected device loaded from local storage is not in the list of current active devices
        // assign the first device from the list of active devices as selected device
        if (this.activeDevicesIDs.length) {
          this.updateSelectedDevice(this.activeDevicesIDs[0], false)
        }
      }
    },
    devices: {
      deep: true,
      handler(devices) {
        if (!devices.length) {
          this.telemetrySettings.opened = false
        }
      },
    },
    socketConnected: {
      /* if devices wasn't initialized in created handler, than it will be initialized here as soon as mqtt socked is connected */
      once: true,
      handler () {
        if (this.socketConnected === true && this.devicesInitialized === false)
        this.poolDevices().then((callback) => {
          this.unsubscribeDevices = callback
        })
      }
    },
    'telemetrySettings.opened': {
      immediate: true,
      handler() {
        this.updateTelemetryDeviceId(this.selectedDevice.id)
      },
    },
    token(val) {
      if (!val) {
        this.$q.loading.hide()
        this.$router.push('/login')
      }
    },
  },
  created() {
    this.resetNewErrorsCounter()
    this.clearErrors()
    this.processRouteParams()
    this.loadActiveDevices()
    if (!this.token) {
      if (this.$route.params.token) {
        this.$router.push(`/login/${this.$route.params.token}`)
      } else {
        this.$router.push('/login')
      }
      return false
    }
    if (!this.devicesInitialized) {
      this.$q.loading.show()
    }
    this.initUserSelectionsFromLS()
    if (this.socketConnected === true) {
      /* if mqtt is already connected - then start initializing devices */
      /* otherwise devices will be initialized in socketConnected watcher */
      this.poolDevices().then((callback) => {
        this.unsubscribeDevices = callback
      })
    }
  },
  unmounted() {
    if (this.socketConnected === true && this.unsubscribeDevices) {
      this.unsubscribeDevices()
    }
    this.unsetDevicesInitialized()
    if (this.socketConnected === true && this.deviceIdForTelemetrySubscription !== 0) {
      this.unsubscribeDeviceTelemetry(this.deviceIdForTelemetrySubscription)
      this.deviceIdForTelemetrySubscription = 0
    }
    this.$connector.socket.off('connect')
  },
})
</script>

<style lang="sass">
.floated
  z-index: 2000
  position: absolute
  &.label
    color: #333
    top: 5px
    left: 70px
    border-radius: 5px
    opacity: .9
    pointer-events: none
    user-select: none
  &.menu
    top: 5px
    left: 10px
  &.github
    top: 5px
    right: 100px
  &.telemetry
    top: 5px
    right: 55px
  &.notifications
    top: 5px
    right: 145px
  &.options
    top: 5px
    right: 10px
  &.date
    top: 60px
    right: 10px
    background-color: white
    padding: 1px
    border-radius: 3px
    box-shadow: 0 0 15px rgba(0,0,0,0.5)
  &.no-devices
    bottom: 150px
    text-align: center
    width: 100%
    pointer-events: none
    user-select: none
    .no-devices__message
      font-size: 3rem
      opacity: .5
      font-weight: bolder
      text-transform: uppercase
  &.white-background
    background: rgba(255,255,255,0.3)
</style>
