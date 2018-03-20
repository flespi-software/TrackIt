<template>
  <q-list separator>
    <q-list-header>
      <big>
        <q-icon name="mdi-arrow-left" size="1.8rem" class="cursor-pointer lt-sm" style="margin-right: 15px" @click.native="$emit('click:hide')"/>
        Devices
      </big>
    </q-list-header>
    <device @update:watch-by-id="setWatchByDeviceID" v-for="device in devices" :key="device.id" :device="device" :activeDevicesID="activeDevicesID" :isDeviceWatched="deviceIdForWatch === device.id"></device>
  </q-list>
</template>

<script>
import { mapActions } from 'vuex'
import Device from './Device.vue'

export default {
  name: 'DeviceList',
  data () {
    return {
      unsubscribeDevices: () => {}
    }
  },
  props: [
    'devices',
    'activeDevicesID',
    'deviceIdForWatch'
  ],
  components: {
    Device
  },
  methods: {
    ...mapActions([
      'poolDevices'
    ]),
    setWatchByDeviceID (id) {
      this.$emit('update:watch-by-id', id)
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
