<template>
  <div id="queue" class="absolute-bottom-left absolute-bottom-right">
    <q-tab-panels v-model="selected" animated style="background: rgba(0, 0, 0, .5)">
      <q-tab-panel
          class="no-padding no-scroll"
          :name="deviceID.toString()"
          v-for="(deviceID) in activeDevicesID"
          :key="`tab-panel-${deviceID}`"
        >
          <queue-item
            :key="`tab-pane-${deviceID}`"
            :id="deviceID"
            :messages="messages[deviceID]"
            :date="date"
            :needShowMessages="needShowMessages"
            :needShowPlayer="needShowPlayer"
            :player="player"
            @player-value="playHandler"
            @player-play="data => $emit('player-play', data)"
            @player-pause="data => $emit('player-pause', data)"
            @player-stop="stopHandler"
            @player-speed="data => $emit('player-speed', data)"
            @player-mode="data => $emit('player-mode', data)"
            @change-need-show-messages="(flag) => {$emit('change-need-show-messages', flag)}"
            @view-on-map="(content)=>{ $emit('view-on-map', content) }"
          />
        </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import QueueItem from './QueueItem'
export default {
  name: 'Queue',
  props: [
    'messages',
    'activeDevicesID',
    'selectedDeviceId',
    'date',
    'needShowMessages',
    'needShowPlayer',
    'player'
  ],
  data () {
    return {
      selected: null,
    }
  },
  methods: {
    playHandler (data) {
      this.$emit('player-value', data)
    },
    stopHandler (data) {
      this.$emit('player-stop', data)
    }
  },
  created () {
    if (this.activeDevicesID.length) {
      this.$emit('queue-created')
    }
    if (this.selectedDeviceId) {
      this.selected = this.selectedDeviceId.toString()
    }
  },
  watch: {
    activeDevicesID (newVal) {
      if (!newVal.length) {
        this.selected = ''
      }
      if ((!this.selected || !newVal.includes(parseInt(this.selected))) && newVal.length) {
        this.selected = newVal[newVal.length - 1].toString()
      }
    },
    selectedDeviceId (id) {
      if (id) {
        this.selected = id.toString()
      }
    }
  },
  components: { QueueItem }
}
</script>

<style lang="stylus">
  #queue
    z-index 1000
    .table__wrapper
      overflow auto
      font-size 80%
      position relative
    .no-messages
      min-height 140px
      opacity 0.7
</style>
