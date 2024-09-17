<template>
  <q-list dark class="bg-grey-9 text-white">
    <q-item ref="header" style="height: 60px; line-height: 58px!important;">
      <q-item-section avatar>
        <q-btn
          flat
          round
          small
          icon="mdi-arrow-left"
          style="margin-right: 15px"
          @click.native="$emit('click-hide')"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label header class="text-bold text-white q-pa-none" style="font-size: 1.3rem">Devices</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn
          v-if="$q.platform.is.desktop"
          round
          flat
          small
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
    <q-item style="height: 50px!important;">
      <q-item-section>
        <div class="q-px-none">
          <q-input v-model="filter" dense dark color="white" outlined label="Filter" hide-bottom-space></q-input>
        </div>
      </q-item-section>
    </q-item>
    <VirtualList
      :size="68"
      :remain="itemsCount"
      :style="{height: `${height}px`}"
    >
      <device
        v-for="device in filteredDevices"
        class="with-separator"
        :key="device.id"
        :device="device"
        :activeDevicesID="activeDevicesID"
        :isSelected="selectedDeviceId === device.id"
        :isFollowed="selectedDeviceId === device.id && isFollowed === true"
        @select-device="$emit('select-device', device.id)"
        @follow-selected-device="$emit('follow-selected-device', !isFollowed)"
        @device-in-devices-list-ckick="$emit('device-in-devices-list-ckick')"
      />
    </VirtualList>
  </q-list>
</template>

<script>
import Device from './Device.vue'
import VirtualList from 'vue-virtual-scroll-list'

export default {
  name: 'DeviceList',
  data () {
    return {
      unsubscribeDevices: () => {},
      itemsCount: 0,
      height: 0,
      filter: ''
    }
  },
  props: [
    'devices',
    'activeDevicesID',
    'selectedDeviceId',
    'isFollowed',
    'devicesListPinned'
  ],
  components: {
    Device,
    VirtualList
  },
  computed: {
    filteredDevices () {
      const filter = this.filter.toLowerCase()
      const filteredItems = this.filter ? this.devices.filter(item => {
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
      }) : this.devices
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
    onResize (height) {
      this.height = height - 110
      this.itemsCount = Math.ceil((height - 110) / 68)
    }
  },
  watch: {
    '$q.screen.height': {
      immediate: true,
      handler (height) {
        this.onResize(height)
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
