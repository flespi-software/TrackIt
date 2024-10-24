<template>
  <div style="position: relative; height: 100dvh; overflow: hidden;">
    <q-list dark class="bg-grey-9 text-white">
      <q-item :style="{'height':`${listHeaderHeight}px` }" style="line-height: 58px!important;">
        <q-item-section avatar>
          <q-btn flat round small
            icon="mdi-chevron-left"
            style="margin-right: 15px"
            @click.native="$emit('click-hide')"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label header class="text-bold text-white q-pa-none" style="font-size: 1.3rem">Devices</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round small
            v-if="$q.platform.is.desktop"
            :icon="devicesListPinned ? 'mdi-pin' : 'mdi-pin-outline'"
            class="text-grey"
            :class="{'unpinned': !devicesListPinned}"
            @click="$emit('devices-list-pinned', !devicesListPinned)"
          >
            <q-tooltip v-if="devicesListPinned">Unpin devices list</q-tooltip>
            <q-tooltip v-else>Pin devices list</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <div :style="{'max-height': `${activeDevicesMaxHeight}px`}" style="overflow: auto;" ref="activeDevicesList">
        <q-resize-observer @resize="onResizeActiveDevicesList"/>
        <ActiveDevice
          v-for="device in classifiedDevices.active"
          class="with-separator"
          :key="device.id"
          :device="device"
          :deviceColor="devicesColors[device.id + '']"
          :activeDevicesID="activeDevicesID"
          :isSelected="selectedDeviceId === device.id"
          :isFollowed="selectedDeviceId === device.id && isFollowed === true"
          @update-color="updateColorHandler"
          @select-device="$emit('select-device', device.id)"
          @follow-selected-device="$emit('follow-selected-device', !isFollowed)"
          @remove-device-from-active-list="deviceRemovedHandler"
          @device-in-devices-list-ckick="$emit('device-in-devices-list-ckick')"
        />
      </div>
      <div v-if="classifiedDevices.inactive.length" style="overflow: auto;">
        <q-item  :style="{'height':`${devicesFilterHeight}px!important` }" style="padding-top: 20px;">
          <q-item-section>
            <div class="q-px-none">
              <q-input v-model="filter" dense dark color="white" outlined label="Filter" hide-bottom-space></q-input>
            </div>
          </q-item-section>
        </q-item>
        <VirtualList
          ref="vlist"
          :size="deviceItemHeight"
          :remain="itemsCount"
          :style="{height: `${inactiveDevicesHeight}px`}"
        >
          <device
            v-for="device in filteredInactiveDevices"
            class="with-separator"
            :key="device.id"
            :device="device"
            @select-device="$emit('select-device', device.id)"
            @follow-selected-device="$emit('follow-selected-device', !isFollowed)"
            @device-in-devices-list-ckick="$emit('device-in-devices-list-ckick')"
          />
        </VirtualList>
      </div>
      <q-item v-else :style="{height: `${inactiveDevicesHeight + devicesFilterHeight}px`}">
        <q-item-label header class="ellipsis text-bold" style="width: 100%; text-align: center">No inactive devices left</q-item-label>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import Device from './Device.vue'
import ActiveDevice from './ActiveDevice.vue'
import VirtualList from 'vue-virtual-scroll-list'

export default {
  name: 'DeviceList',
  data () {
    return {
      unsubscribeDevices: () => {},
      itemsCount: 0,
      viewportHeight: 0,
      activeDevicesHeight: 0,
      activeDevicesMaxHeight: 0,
      inactiveDevicesHeight: 0,
      listHeaderHeight: 60,
      devicesFilterHeight: 70,
      deviceItemHeight: 71,
      filter: ''
    }
  },
  props: [
    'devices',
    'devicesColors',
    'activeDevicesID',
    'selectedDeviceId',
    'isFollowed',
    'devicesListPinned'
  ],
  components: {
    ActiveDevice,
    Device,
    VirtualList
  },
  computed: {
    classifiedDevices () {
      /* classify all devices as active and inactive, basing on activeDevicesID property */
      const classifiedDevices = {
        active: [],
        inactive: []
      }
      this.devices.forEach((device) => {
        if (this.activeDevicesID.includes(device.id)) {
          classifiedDevices.active.push(device)
        } else {
          classifiedDevices.inactive.push(device)
        }
      })
      return classifiedDevices
    },
    filteredInactiveDevices () {
      const filter = this.filter.toLowerCase()
      const filteredItems = this.filter ? this.classifiedDevices.inactive.filter(item => {
        return (
          item &&
          typeof item.name !== 'undefined' &&
          item.name !== null &&
          item.name.toLowerCase().indexOf(filter) >= 0
        ) ||
        (
          item &&
          typeof item.id !== 'undefined' &&
          item.id !== null &&
          (item.id + '').indexOf(filter) >= 0
        ) ||
        (
          item && item.configuration &&
          typeof item.configuration.ident !== 'undefined' &&
          item.configuration.ident !== null &&
          item.configuration.ident.toLowerCase().indexOf(filter) >= 0
        )
      }) : this.classifiedDevices.inactive
      filteredItems.sort((l, r) => {
        if (!l.name) { return -1 }
        if (!r.name) { return 1 }
        const lName = l.name.toLowerCase()
        const rName = r.name.toLowerCase()
        if (lName < rName) {
          return -1
        } else if (lName > rName) {
          return 1
        }
        return 1
      })
      return filteredItems
    }
  },
  methods: {
    onResizeScreen (height) {
      /* screen is resized */
      this.viewportHeight = height
      /* calculate max height of the active devices list, either to fit 10 devices, or to occupy 70% of viewport's height */
      const height70Percent = Math.ceil(height * 0.7)
      this.activeDevicesMaxHeight = height70Percent > this.deviceItemHeight * 10 ? this.deviceItemHeight * 10 : height70Percent
      /* re-calculate heights of left drawer's components */
      this.activeDevicesHeight = this.$refs.activeDevicesList ? this.$refs.activeDevicesList.clientHeight : 0
      this.inactiveDevicesHeight = this.viewportHeight - this.listHeaderHeight - this.devicesFilterHeight - this.activeDevicesHeight
      this.itemsCount = Math.ceil(this.inactiveDevicesHeight / this.deviceItemHeight)
    },
    onResizeActiveDevicesList (size) {
      /* the list of active devices was resized */
      /* re-calculate heights of left drawer's components */
      this.activeDevicesHeight = size.height
      this.inactiveDevicesHeight = this.viewportHeight - this.listHeaderHeight - this.devicesFilterHeight - this.activeDevicesHeight
      this.itemsCount = Math.ceil(this.inactiveDevicesHeight / this.deviceItemHeight)
    },
    deviceRemovedHandler () {
      /* device is moved from the active list to the inactive list */
      /* increase the height of inactive devices list by adding height of one list item, in order to prevent blinking */
      this.inactiveDevicesHeight = this.inactiveDevicesHeight + this.deviceItemHeight
      this.itemsCount = Math.ceil(this.inactiveDevicesHeight / this.deviceItemHeight)
    },
    updateColorHandler (newVal) {
      /* newVal format is {"id":5916480,"color":"#823ce6"} */
      this.$emit('update-color', newVal.id, newVal.color)
    }
  },
  watch: {
    activeDevicesID () {
      /* force virtual list to re-render, needed because by default it sometimes doesn't render the list correctly */
      /* when device is made inactive and returned back to the list */
      if (this.$refs.vlist) {
        this.$refs.vlist.forceRender()
      }
    },
    '$q.screen.height': {
      immediate: true,
      handler (height) {
        this.onResizeScreen(height)
      }
    }
  }
}
</script>

<style lang="stylus">
  .unpinned
    transform rotate(45deg);
  .with-separator
    border-top 1px solid #666
</style>
