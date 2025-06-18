<template>
  <div id="queue" class="absolute-bottom-left absolute-bottom-right">
    <q-tab-panels v-model="selected" animated style="background: rgba(0, 0, 0, 0.5)">
      <q-tab-panel
        class="no-padding no-scroll"
        :name="deviceID.toString()"
        v-for="deviceID in activeDevicesIDs"
        :key="`tab-panel-${deviceID}`"
      >
        <queue-item
          :id="deviceID"
          :needShowMessages="needShowMessages"
          :needShowPlayer="needShowPlayer"
          :player="player"
          @change-need-show-messages="
            (flag) => {
              $emit('change-need-show-messages', flag)
            }
          "
          @player-mode="(data) => $emit('player-mode', data)"
          @player-pause="(data) => $emit('player-pause', data)"
          @player-play="(data) => $emit('player-play', data)"
          @player-speed="(data) => $emit('player-speed', data)"
          @player-stop="(data) => $emit('player-stop', data)"
          @player-value="(data) => $emit('player-value', data)"
          @view-on-map="
            (content) => {
              $emit('view-on-map', content)
            }
          "
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import QueueItem from './QueueItem.vue'
import { useDevicesStore } from '../stores/devices'

export default defineComponent({
  name: 'DevicesQueue',
  components: {
    QueueItem,
  },
  emits: [
    'change-need-show-messages',
    'player-mode',
    'player-pause',
    'player-play',
    'player-speed',
    'player-stop',
    'player-value',
    'view-on-map',
  ],
  props: ['needShowMessages', 'needShowPlayer', 'player', 'selectedDeviceId'],
  computed: {
    ...mapState(useDevicesStore, {
      activeDevicesIDs: (store) => store.activeDevicesIDs,
    }),
  },
  data() {
    return {
      selected: null,
    }
  },
  watch: {
    activeDevicesIDs: {
      deep: true,
      handler(newVal) {
        if (!newVal.length) {
          this.selected = ''
        }
        if ((!this.selected || !newVal.includes(parseInt(this.selected))) && newVal.length) {
          this.selected = newVal[newVal.length - 1].toString()
        }
      },
    },
    selectedDeviceId(id) {
      if (id) {
        this.selected = id.toString()
      }
    },
  },
})
</script>

<style lang="sass">
#queue
  z-index: 1000
  .table__wrapper
    overflow: auto
    font-size: 80%
    position: relative
  .no-messages
    min-height: 140px
    opacity: 0.7
</style>
