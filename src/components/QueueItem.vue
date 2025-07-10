<template>
  <div :style="[{ height: height }]">
    <div
      v-if="needShowMessages"
      :style="{ height: needShowPlayer ? `calc(100% - ${playerHeight}px)` : '100%' }"
      class="table__wrapper"
    >
      <messages-grid
        style="height: 100%"
        :activeMessagesIds="activeMessagesIndexes"
        :id="id"
        :limit="0"
        @view-message-content="viewMessageContentHandler"
        @view-on-map="
          (content) => {
            $emit('view-on-map', content)
          }
        "
      />
    </div>
    <div>
      <q-resize-observer @resize="onResizePlayer" ref="playerResize" />
      <messages-player
        ref="player"
        v-model="playerValue"
        :min="timeRange.min"
        :max="timeRange.max"
        :mode="player.mode"
        :needShowMessages="needShowMessages"
        :speed="player.speed"
        :status="player.status"
        @player-next="playerNextHandler"
        @player-prev="playerPrevHandler"
        @player-play="playerPlayHandler"
        @player-pause="playerPauseHandler"
        @player-stop="playerStopHandler"
        @player-speed="playerSpeedHandler"
        @switch-show-messages="switchShowMessages"
        @switch-player-mode="switchPlayerMode"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { useMiscStore } from 'src/stores/misc'
import MessagesGrid from './MessagesGrid.vue'
import MessagesPlayer from './MessagesPlayer.vue'

export default defineComponent({
  name: 'QueueItem',
  components: {
    MessagesGrid,
    MessagesPlayer,
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
  props: ['id', 'needShowMessages', 'needShowPlayer', 'player'],
  data() {
    return {
      activeMessagesIndexes: [],
      messagesFlag: this.needShowMessages,
      playerHeight: 0,
      playerMode: this.player.mode || 'time',
      playerStatus: 'stop',
      playerValue: 0,
    }
  },
  computed: {
    ...mapState(useMiscStore, {
      date: (store) => store.date,
    }),
    height() {
      if (this.needShowMessages && this.needShowPlayer) {
        return `calc(22vh + ${this.playerHeight}px)`
      } else if (this.needShowMessages && !this.needShowPlayer) {
        return '22vh'
      } else if (!this.needShowMessages && this.needShowPlayer) {
        return `${this.playerHeight}px`
      } else {
        return '0vh'
      }
    },
    indexesByTimestamp() {
      return this.messages.reduce((result, message, index) => {
        const key = Math.floor(message.timestamp)
        if (!result[key]) {
          result[key] = []
        }
        result[key].push(index)
        return result
      }, {})
    },
    timeRange() {
      if (!this.messages.length) {
        return {
          min: 0,
          max: 0,
        }
      }
      return {
        min: Math.floor(this.messages[0].timestamp),
        max: Math.floor(this.messages[this.messages.length - 1].timestamp),
      }
    },
    messages() {
      return this.getMessagesStore(this.id).messages
    },
  },
  methods: {
    ...mapActions(useMiscStore, ['getMessagesStore']),
    getCurrentActiveTimestamp() {
      let currentTimestamp = 0
      const timestamps = Object.keys(this.indexesByTimestamp)
      timestamps.every((timestamp, index) => {
        if (this.playerValue >= timestamp) {
          currentTimestamp = timestamp
          return true
        } else {
          return false
        }
      })
      return currentTimestamp
    },
    onResizePlayer(size) {
      this.playerHeight = size.height
    },
    playerNextHandler() {
      const timestamps = Object.keys(this.indexesByTimestamp),
        index = timestamps.indexOf(this.getCurrentActiveTimestamp())
      if (index === timestamps.length - 1) {
        this.$q.notify({
          message: 'That`s the last message',
          color: 'info',
          position: 'bottom-left',
        })
        return false
      }
      this.playerValue = timestamps[index + 1]
    },
    playerPauseHandler() {
      this.playerStatus = 'pause'
      this.$emit('player-pause', { id: this.id })
    },
    playerPlayHandler() {
      this.playerStatus = 'play'
      if (!this.playerValue) {
        this.playerValue = Math.floor(this.messages[0].timestamp)
      }
      this.$emit('player-play', { id: this.id })
    },
    playerPrevHandler() {
      const timestamps = Object.keys(this.indexesByTimestamp),
        index = timestamps.indexOf(this.getCurrentActiveTimestamp())
      if (index === 0) {
        this.$q.notify({
          message: 'That`s the first message',
          color: 'info',
          position: 'bottom-left',
        })
        return false
      }
      this.playerValue = timestamps[index - 1]
    },
    playerSpeedHandler(speed) {
      this.$emit('player-speed', { id: this.id, speed })
    },
    playerStopHandler() {
      this.playerStatus = 'stop'
      if (this.messages.length) {
        this.playerValue = Math.floor(this.messages[0].timestamp)
      } else {
        this.playerValue = 0
      }
      this.$emit('player-stop', { id: this.id })
    },
    switchPlayerMode() {
      this.playerMode = this.playerMode === 'data' ? 'time' : 'data'
      this.$emit('player-mode', { mode: this.playerMode, id: this.id })
    },
    switchShowMessages() {
      this.messagesFlag = !this.messagesFlag
      this.$emit('change-need-show-messages', this.messagesFlag)
    },
    viewMessageContentHandler() {
      if (this.$refs.player && this.playerStatus !== 'stop') {
        this.$refs.player.stop()
      }
    },
  },
  watch: {
    date() {
      this.playerValue = 0
      this.playerStatus = 'stop'
    },
    needShowMessages(val) {
      this.messagesFlag = val
    },
    player: {
      deep: true,
      handler(player) {
        if (player.currentMsgTimestamp !== null) {
          // Find the message index that matches the current timestamp
          const messageIndex = this.messages.findIndex(msg => msg.timestamp === player.currentMsgTimestamp)
          if (messageIndex !== -1 && 
              (this.activeMessagesIndexes.length === 0 || this.activeMessagesIndexes[0] !== messageIndex)) {
            this.activeMessagesIndexes = [messageIndex]
          }
        } else {
          this.activeMessagesIndexes = []
        }
      },
    },
    playerValue(value, prev) {
      let currentTimestamp = 0,
        isEquilPrevTimestamp = true
      const timestamps = Object.keys(this.indexesByTimestamp)
      timestamps.every((timestamp, index) => {
        if (value >= timestamp) {
          currentTimestamp = timestamp
          if (index === timestamps.length - 1) {
            isEquilPrevTimestamp = false
          }
          return true
        } else {
          if (prev >= timestamp || prev < currentTimestamp) {
            isEquilPrevTimestamp = false
          }
          return false
        }
      })
      if (!isEquilPrevTimestamp && this.playerMode === 'time') {
        this.$emit('player-value', {
          id: this.id,
          messagesIndexes: this.indexesByTimestamp[currentTimestamp],
        })
        this.activeMessagesIndexes = this.indexesByTimestamp[currentTimestamp] || []
      }
    },
  },
  mounted() {
    if (this.$refs.playerResize) {
      // TODO: check if this is really needed
      // this.$refs.playerResize.trigger()
    }
  },
})
</script>

<style lang="sass"></style>
