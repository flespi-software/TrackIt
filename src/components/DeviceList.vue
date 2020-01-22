<template>
  <q-list separator>
    <q-item-label ref="header" style="height: 58px; line-height: 58px!important;">
      <big>
        <q-icon name="mdi-arrow-left" size="1.8rem" class="cursor-pointer" style="margin-right: 15px" @click.native="$emit('click:hide')"/>
        Devices
      </big>
    </q-item-label>
    <VirtualList
      :size="64"
      :remain="itemsCount"
      :style="{height: `${height}px`}"
    >
      <device @update:watch-by-id="setWatchByDeviceID" v-for="device in devices" :key="device.id" :device="device" :activeDevicesID="activeDevicesID" :isDeviceWatched="deviceIdForWatch === device.id" />
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
      height: 0
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
  methods: {
    setWatchByDeviceID (id) {
      this.$emit('update:watch-by-id', id)
    },
    onResize (height) {
      this.height = height - 76
      this.itemsCount = Math.floor((height - 76) / 70)
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
