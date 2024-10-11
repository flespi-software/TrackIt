<template>
  <q-item
    :highlight="$q.platform.is.desktop"
    :class="[isActive && isSelected ? 'device-item__selected' : '', device['x-flespi-no-access'] ? 'no-access-device' : '']"
    style="min-height: 71px;"
    class="device-item__hover"
    clickable
    @click="deviceClickHandler"
    v-touch-swipe.noMouse="removeDeviceHandler">
    <q-tooltip v-if="device['x-flespi-no-access']">Device has no access to messages and telemetry</q-tooltip>
    <div
      class="text-center absolute-top-left bg-grey-3 text-bold text-grey-9"
      style="font-size:10px;min-width:55px;padding-top:1px;z-index:1;border-radius:0 0 3px 0;line-height:10px;">
      #{{device.id}}
    </div>
    <q-item-section side style="position: relative;">
      <q-icon
        size="1.7rem"
        name="mdi-developer-board"
      />
      <div v-if="isActive"
        style="position: absolute; top: 29px; right: 8px;"
        :style="{backgroundColor: deviceColor ? deviceColor : '#909090'}"
        class="color-view q-mr-xs"
        @click.stop="changeColorHandler(device.id)">
        <q-tooltip>Change color</q-tooltip>
      </div>
    </q-item-section>
    <q-item-section>
      <q-item-label class="ellipsis-2-lines q-pa-none" :class="[isActive ? 'text-white' : '']" header>{{device.name || '&lt;noname&gt;'}}</q-item-label>
    </q-item-section>
    <q-item-section v-if="isActive" side class="text-center">
      <q-item-label>
        <q-icon
          :class="[isSelected ? 'icon__send-followed' : 'text-grey-5']"
          size="1.2rem"
          :name="isFollowed ? 'mdi-crosshairs-gps' : 'mdi-crosshairs'"
          @click.stop.native="showOnMapButtonHandler">
          <q-tooltip v-if="!isFollowed" v-model="displayTooltip">Follow device on map</q-tooltip>
          <q-tooltip v-else v-model="displayTooltip">Stop following device</q-tooltip>
        </q-icon>
      </q-item-label>
    </q-item-section>
    <q-item-section v-if="isActive && $q.platform.is.desktop" class="hiding-cross">
      <q-item-label>
        <q-icon
          name="mdi-close"
          size="1.1rem"
          @click.stop.native="removeDeviceHandler">
          <q-tooltip>Remove from active devices list</q-tooltip>
        </q-icon>
      </q-item-label>
    </q-item-section>

    <color-modal ref="colorModal" v-model="color"/>
  </q-item>
</template>

<script>
import ColorModal from './ColorModal'
export default {
  props: [
    'device',
    'deviceColor',
    'activeDevicesID',
    'isActive',
    'isSelected',
    'isFollowed'
  ],
  data () {
    return {
      displayTooltip: false,
      currentColorModel: '#fff',
      currentColorId: 0
    }
  },
  computed: {
    color: {
      get () { return this.currentColorModel },
      set (color) {
        this.$emit('update-color', { id: this.currentColorId, color })
        this.currentColorModel = color
      }
    }
  },
  methods: {
    deviceClickHandler () {
      if (!this.isActive) {
        /* inactive device was clicked */
        /* add the device into the list of active devices */
        this.$store.commit('setActiveDevice', this.device.id)
      } else if (!this.isSelected) {
        /* active device was clicked */
        /* if it's not yet selected, notify MyLayout that new device is seleted */
        setTimeout(() => { this.$emit('select-device', this.device.id) }, 500)
      }
      /* notify MyLayout to close the left drawer, if needed */
      this.$emit('device-in-devices-list-ckick', this.isActive)
    },
    removeDeviceHandler (details) {
      if (this.isActive) {
        if (details && details.direction && details.direction !== 'right') {
          /* this is swipe action, process only swipe to the right */
          return false
        }
        /* device was removed from the list of active devices */
        /* remove device from state */
        this.$store.commit('unsetActiveDevice', this.device.id)
        /* notify DeviceList to recalculate heights of the active and inactive devices' lists */
        this.$emit('remove-device-from-active-list')
      }
    },
    changeColorHandler (id) {
      /* user clicked Change color button */
      /* init and show color picker dialog */
      this.currentColorId = id
      this.currentColorModel = this.deviceColor
      this.$refs.colorModal.show()
    },
    showOnMapButtonHandler () {
      if (!this.isSelected) {
        /* user clicked 'Show on map' button for active, but not previously selected device */
        /* notify MyLayout that new device is seleted */
        setTimeout(() => { this.$emit('select-device', this.device.id) }, 500)
      } else {
        /* user clicked 'Show on Map' button for selected device */
        /* if device is not followed, then notify MyLayout to start following the device */
        /* otherwise notify MyLayout to stop following the device */
        setTimeout(() => { this.$emit('follow-selected-device', !this.isFollowed) }, 500)
      }
      /* cleanup tooltip */
      setTimeout(() => { this.displayTooltip = false }, 500)
    }
  },
  components: { ColorModal }
}
</script>

<style lang="stylus">
  .device-item__selected
    background-color $grey-7
  .icon__send-followed
    color white
  .no-access-device
    box-shadow inset 0 0 10px #f40
  .device-item__hover
    position relative
    &:hover > .hiding-cross
      display block
  .hiding-cross
    position absolute
    top 1px
    right 3px
    display none
  .color-view
    display inline-block
    width 15px
    height 15px
    border solid white 2px
    border-radius 50%
</style>
