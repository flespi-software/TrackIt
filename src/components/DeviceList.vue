<template>
  <q-list separator>
    <q-list-header>
      <q-icon class="pull-right cursor-pointer" name="refresh" @click="getDevices" size="1.5rem" style="margin: .7rem .7rem 0 0"></q-icon>
      <big>Devices</big>
    </q-list-header>
    <device @update:watch-by-id="setWatchByDeviceID" v-for="device in devices" :key="device.id" :device="device" :activeDevicesID="activeDevicesID" :isDeviceWatched="deviceIdForWatch === device.id"></device>
  </q-list>
</template>

<script>
  import { QList, QListHeader, QIcon } from 'quasar-framework'
  import { mapActions } from 'vuex'
  import Device from './Device.vue'

  export default {
    name: 'DeviceList',
    props: [
      'devices',
      'activeDevicesID',
      'deviceIdForWatch'
    ],
    data () {
      return {
        intervalId: 0
      }
    },
    components: {
      QList, QListHeader, QIcon, Device
    },
    methods: {
      ...mapActions(['getDevices']),
      setWatchByDeviceID (id) {
        this.$emit('update:watch-by-id', id)
      }
    },
    created () {
      if (!this.$store.state.token) {
        return false
      }
      this.getDevices()
      this.intervalId = setInterval(this.getDevices, 30000)
    },
    beforeDestroy () {
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
    }
  }
</script>

<style>
</style>
