<template>
  <q-item
    :highlight="$q.platform.is.desktop"
    :class="[isSelected ? 'device-item__selected' : (isActive ? 'device-item__active': ''), device['x-flespi-no-access'] ? 'no-access-device' : '']"
    clickable
    @click="deviceClickHandler">
    <q-tooltip v-if="device['x-flespi-no-access']">Device has no access to messages and telemetry</q-tooltip>
    <q-item-section avatar :class="[isActive ? 'text-green-2': '']" class="flex flex-center">
      <q-icon name="mdi-developer-board" />
      <small>#{{device.id}}</small>
    </q-item-section>
    <q-item-section>
      <q-item-label class="ellipsis q-pa-none text-white" header>{{device.name || '&lt;noname&gt;'}}</q-item-label>
      <q-item-label class="ellipsis text-grey-3 full-width" caption><q-icon name="mdi-label-outline" /> {{device.configuration && device.configuration.ident ? device.configuration.ident : '&lt;no ident&gt;'}}</q-item-label>
      <q-item-label caption class="text-grey-3"><q-icon name="mdi-phone" /> {{device.configuration && device.configuration.phone ? device.configuration.phone : '&lt;no phone&gt;'}}</q-item-label>
    </q-item-section>
    <q-item-section side class="text-center">
      <q-item-label>
        <q-icon
          :class="[isFollowed ? 'icon__send-followed' : 'text-grey-5']"
          size="1.5rem"
          :name="isFollowed ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'"
          @click.stop.native="showOnMapButtonHandler">
          <q-tooltip v-if="!isSelected" v-model="displayTooltip">Show device on map</q-tooltip>
          <q-tooltip v-else-if="!isFollowed" v-model="displayTooltip">Follow device on map</q-tooltip>
          <q-tooltip v-else v-model="displayTooltip">Stop following device</q-tooltip>
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
    'isSelected',
    'isFollowed'
  ],
  data () {
    return {
      displayTooltip: false
    }
  },
  computed: {
    isActive () {
      return this.activeDevicesID.includes(this.device.id)
    }
  },
  methods: {
    deviceClickHandler () {
      this.$emit('device-in-devices-list-ckick')
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
    showOnMapButtonHandler () {
      if (!this.isActive) {
        /* user clicked 'Show on map' button for inactive device */
        /* add device to the list of active devices */
        this.setActiveDevice()
        /* and throw event to MyLayout that new device is seleted */
        setTimeout(() => { this.$emit('select-device', this.device.id) }, 500)

      } else if (!this.isSelected) {
        /* user clicked 'Show on map' button for active, but not previously selected device */
        /* throw event to MyLayout that new device is seleted */
        setTimeout(() => { this.$emit('select-device', this.device.id) }, 500)

      } else {
        /* user clicked 'Show on Map' button for selected device */
        /* if device is not followed, then throw event to MyLayout to start following the device */
        /* otherwise throw event to MyLayout to stop following the device */
        setTimeout(() => { this.$emit('follow-selected-device', !this.isFollowed) }, 500)

      }
      /* cleanup tooltip */
      setTimeout(() => { this.displayTooltip = false }, 500)
    }
  }
}
</script>

<style lang="stylus">
  .device-item__active
    background-color $grey-8
  .device-item__selected
    background-color $grey-7
  .icon__send-followed
    color white
  .no-access-device
    box-shadow inset 0 0 10px #f40
</style>
