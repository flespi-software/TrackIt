<template>
  <q-item
    :highlight="$q.platform.is.desktop"
    :class="[device['x-flespi-no-access'] ? 'no-access-device' : '']"
    style="min-height: 71px;"
    class="device-item__hover"
    clickable
    @click="deviceClickHandler">
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
    </q-item-section>
    <q-item-section>
      <q-item-label class="ellipsis-2-lines q-pa-none" header>{{device.name || '&lt;noname&gt;'}}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  props: [
    'device'
  ],
  data () {
    return {}
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
      /* inactive device was clicked */
      /* add the device into the list of active devices */
      this.$store.commit('setActiveDevice', this.device.id)
      /* notify MyLayout to close the left drawer, if needed */
      this.$emit('device-in-devices-list-ckick', false)
    }
  }
}
</script>

<style lang="stylus">
  .no-access-device
    box-shadow inset 0 0 10px #f40
  .device-item__hover
    position relative
</style>
