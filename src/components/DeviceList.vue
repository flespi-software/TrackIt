<template>
  <q-list separator>
    <q-window-resize-observable @resize="onResize" />
    <q-list-header ref="header">
      <big>
        <q-icon name="mdi-arrow-left" size="1.8rem" class="cursor-pointer" style="margin-right: 15px" @click.native="$emit('click:hide')"/>
        Devices
      </big>
    </q-list-header>
    <VirtualList
      :size="70"
      :remain="itemsCount"
    >
      <device @update:watch-by-id="setWatchByDeviceID" v-for="device in devices" :key="device.id" :device="device" :activeDevicesID="activeDevicesID" :isDeviceWatched="deviceIdForWatch === device.id" />
    </VirtualList>
  </q-list>
</template>

<script>
import { mapActions } from 'vuex'
import Device from './Device.vue'
import VirtualList from 'vue-virtual-scroll-list'

export default {
  name: 'DeviceList',
  data () {
    return {
      unsubscribeDevices: () => {},
      itemsCount: 0
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
    ...mapActions([
      'poolDevices'
    ]),
    setWatchByDeviceID (id) {
      this.$emit('update:watch-by-id', id)
    },
    onResize ({height}) {
      this.itemsCount = (height - 76) / 70
    }
  },
  async created () {
    if (!this.$store.state.token) {
      return false
    }
    this.unsubscribeDevices = await this.poolDevices()
  },
  beforeDestroy () {
    this.unsubscribeDevices()
  }
}
</script>

<style>
</style>
