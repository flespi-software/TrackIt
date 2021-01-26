<template>
  <q-list separator class="bg-grey-9 text-white">
    <q-item-label ref="header" style="height: 138px; line-height: 58px!important;">
      <big>
        <q-icon name="mdi-arrow-left" size="1.8rem" class="cursor-pointer" style="margin-right: 15px" @click.native="$emit('click-hide')"/>
        Devices
      </big>
      <div class="q-px-sm">
        <q-input v-model="filter" dark color="white" outlined label="Filter" hide-bottom-space></q-input>
      </div>
    </q-item-label>
    <VirtualList
      :size="68"
      :remain="itemsCount"
      :style="{height: `${height}px`}"
    >
      <device @update-watch-by-id="setWatchByDeviceID" v-for="device in filteredDevices" :key="device.id" :device="device" :activeDevicesID="activeDevicesID" :isDeviceWatched="deviceIdForWatch === device.id" />
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
    'deviceIdForWatch'
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
    setWatchByDeviceID (id) {
      this.$emit('update-watch-by-id', id)
    },
    onResize (height) {
      this.height = height - 138
      this.itemsCount = Math.ceil((height - 138) / 68)
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

<style>
</style>
