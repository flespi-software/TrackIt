<template>
  <q-item
    clickable
    :highlight="$q.platform.is.desktop"
    :class="[device['x-flespi-no-access'] ? 'no-access-device' : '']"
    style="min-height: 71px"
    class="device-item__hover"
    @click="deviceClickHandler"
  >
    <q-tooltip v-if="device['x-flespi-no-access']"
      >Device has no access to messages and telemetry</q-tooltip
    >
    <div
      class="text-center absolute-top-left bg-grey-3 text-bold text-grey-9"
      style="
        font-size: 10px;
        min-width: 55px;
        padding-top: 1px;
        z-index: 1;
        border-radius: 0 0 3px 0;
        line-height: 10px;
      "
    >
      #{{ device.id }}
    </div>
    <q-item-section side style="position: relative">
      <q-icon size="1.7rem" name="mdi-developer-board" />
    </q-item-section>
    <q-item-section>
      <q-item-label class="ellipsis-2-lines q-pa-none" header>{{
        device.name || '&lt;noname&gt;'
      }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { mapActions } from 'pinia'
import { defineComponent } from 'vue'
import { useDevicesStore } from '../stores/devices'

export default defineComponent({
  name: 'InactiveDevice',
  emits: ['device-in-list-clicked'],
  props: ['device'],
  data() {
    return {}
  },
  methods: {
    ...mapActions(useDevicesStore, ['addActiveDevice']),
    deviceClickHandler() {
      /* inactive device was clicked */
      /* add the device into the list of active devices */
      this.addActiveDevice(this.device.id)
      /* notify MyLayout to close the left drawer, if needed */
      this.$emit('device-in-list-clicked', false)
    },
  },
})
</script>

<style lang="sass">
.no-access-device
  box-shadow: inset 0 0 10px #f40
.device-item__hover
  position: relative
</style>
