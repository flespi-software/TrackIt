<template>
  <q-item 
    :highlight="$q.platform.is.desktop" 
    :class="[model ? 'device-item__active': '', device['x-flespi-no-access'] ? 'inactive-device' : '']" 
    clickable
    @click="deviceClickHandler">
    <q-tooltip v-if="device['x-flespi-no-access']">Device has no access to messages and telemetry</q-tooltip>
    <q-item-section avatar :class="[model ? 'text-green-2': '']" class="flex flex-center">
      <q-icon name="developer_board" />
      <small>#{{device.id}}</small>
    </q-item-section>
    <q-item-section>
      <q-item-label class="ellipsis q-pa-none text-white" header>{{device.name || '&lt;noname&gt;'}}</q-item-label>
      <q-item-label class="ellipsis text-grey-3 full-width" caption><q-icon name="label_outline" /> {{device.configuration && device.configuration.ident ? device.configuration.ident : '&lt;no ident&gt;'}}</q-item-label>
      <q-item-label caption class="text-grey-3"><q-icon name="phone" /> {{device.configuration && device.configuration.phone ? device.configuration.phone : '&lt;no phone&gt;'}}</q-item-label>
    </q-item-section>
    <q-item-section side class="text-center">
      <q-item-label>
        <q-icon 
          :class="[isDeviceWatched && activeDevicesID.includes(device.id) ? 'icon__send-active' : 'text-grey-5']" 
          size="1.5rem" 
          name="gps_fixed" 
          @click.stop.native="watchDeviceHandler">
          <q-tooltip v-model="watchTooltip">Show on map</q-tooltip>
        </q-icon>
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  props: [
    'device',
    'activeDevicesID',
    'isDeviceWatched'
  ],
  data () {
    return {
      watchTooltip: false
    }
  },
  computed: {
    model () {
      return this.activeDevicesID.includes(this.device.id)
    }
  },
  methods: {
    deviceClickHandler () {
      if (this.activeDevicesID.includes(this.device.id)) {
        this.unsetActiveDevice()
      } else {
        this.setActiveDevice()
      }
    },
    setActiveDevice () {
      this.$store.commit('setActiveDevice', this.device.id)
    },
    unsetActiveDevice () {
      this.$store.commit('unsetActiveDevice', this.device.id)
    },
    watchDeviceHandler () {
      if (!this.activeDevicesID.includes(this.device.id)) {
        this.setActiveDevice()
      }
      if (!this.isDeviceWatched) {
        setTimeout(() => { this.$emit('update-watch-by-id', this.device.id) }, 500)
      }
      setTimeout(() => { this.watchTooltip = false }, 500)
    }
  }
}
</script>

<style lang="stylus">
  .device-item__active
    background-color $grey-7
  .icon__send-active
    color white
  .inactive-device
    box-shadow inset 0 0 10px #f40
</style>
