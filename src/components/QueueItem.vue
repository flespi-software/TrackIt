<template>
  <div :style="[{height: height, position: 'relative'}]">
    <template v-if="needShowMessages">
      <div :style="{height: needShowPlayer ? 'calc(100% - 65px)' : '100%'}" class="table__wrapper">
        <messages
          style="height: 100%;"
          :messages="messages"
          :item="device"
          :activeDeviceId="id"
          :limit="0"
          :date="date"
          :activeMessagesIds="activeMessagesIndexes"
          @view="viewMessageHandler"
          @view-on-map="viewOnMapHandler"
        ></messages>
      </div>
    </template>
    <div
      style="display: flex; background-color: #424242;"
      :style="{height: needShowMessages ? '65px' : '100%'}"
      v-if="needShowPlayer"
    >
      <q-btn
        icon="dvr"
        :color="needShowMessages ? 'blue' : 'white'"
        :dense="$q.platform.is.mobile"
        :size="$q.platform.is.desktop ? '1.4rem' : 'md'"
        flat
        @click="messagesFlag = !messagesFlag, $emit('change-need-show-messages', messagesFlag)"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Messages</q-tooltip>
      </q-btn>
      <q-btn
        :icon="player.mode === 'time' ? 'mdi-map-clock-outline' : 'mdi-map-marker-distance'"
        :disable="player.status === 'play'"
        color="white"
        :dense="$q.platform.is.mobile"
        :size="$q.platform.is.desktop ? '1.4rem' : 'md'"
        flat
        @click="playerMode = playerMode === 'data' ? 'time' : 'data', $emit('player-mode', {mode: playerMode, id})"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Change mode (Time/Data)</q-tooltip>
      </q-btn>
      <player
        ref="player"
        v-model="playerValue"
        :min="timeRange.min"
        :max="timeRange.max"
        :status="player.status"
        :speed="player.speed"
        :mode="player.mode"
        @player-next="playerNextHandler"
        @player-prev="playerPrevHandler"
        @player-play="playerPlayHandler"
        @player-pause="playerPauseHandler"
        @player-stop="playerStopHandler"
        @player-speed="playerSpeedHandler"
      />
    </div>
  </div>
</template>

<script>
import Messages from './Messages'
import Player from './Player'
export default {
  name: 'QueueItem',
  props: [
    'id',
    'messages',
    'date',
    'device',
    'needShowMessages',
    'needShowPlayer',
    'player'
  ],
  data () {
    return {
      playerMode: this.player.mode || 'time',
      playerValue: 0,
      playerStatus: 'stop',
      activeMessagesIndexes: [],
      messagesFlag: this.needShowMessages
    }
  },
  computed: {
    timeRange () {
      if (!this.messages.length) {
        return {
          min: 0,
          max: 0
        }
      }
      return {
        min: Math.floor(this.messages[0].timestamp),
        max: Math.floor(this.messages[this.messages.length - 1].timestamp)
      }
    },
    indexesByTimestamp () {
      return this.messages.reduce((result, message, index) => {
        const key = Math.floor(message.timestamp)
        if (!result[key]) {
          result[key] = []
        }
        result[key].push(index)
        return result
      }, {})
    },
    height () {
      if (this.messages.length) {
        if (this.needShowMessages && !this.needShowPlayer) {
          return '20vh'
        } else if (!this.needShowMessages && this.needShowPlayer) {
          return '65px'
        } else {
          return '30vh'
        }
      } else {
        if (this.needShowMessages && this.needShowPlayer) {
          return '30vh'
        } else if (this.needShowMessages && !this.needShowPlayer) {
          return '20vh'
        } else if (!this.needShowMessages && this.needShowPlayer) {
          return '65px'
        } else {
          return '0vh'
        }
      }
    }
  },
  methods: {
    getCurrentActiveTimestamp () {
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
    update (timestamp) {
      if (this.playerMode !== 'time') { return }
      this.$emit('player-value', { id: this.id, messagesIndexes: this.indexesByTimestamp[timestamp] })
      this.activeMessagesIndexes = this.indexesByTimestamp[timestamp] || []
    },
    playerNextHandler () {
      const timestamps = Object.keys(this.indexesByTimestamp),
        index = timestamps.indexOf(this.getCurrentActiveTimestamp())
      if (index === timestamps.length - 1) {
        this.$q.notify({
          message: 'That`s last message',
          color: 'info',
          position: 'bottom-left'
        })
        return false
      }
      this.playerValue = timestamps[index + 1]
    },
    playerPrevHandler () {
      const timestamps = Object.keys(this.indexesByTimestamp),
        index = timestamps.indexOf(this.getCurrentActiveTimestamp())
      if (index === 0) {
        this.$q.notify({
          message: 'That`s first message',
          color: 'info',
          position: 'bottom-left'
        })
        return false
      }
      this.playerValue = timestamps[index - 1]
    },
    playerPlayHandler () {
      this.playerStatus = 'play'
      if (!this.playerValue) {
        this.playerValue = Math.floor(this.messages[0].timestamp)
      }
      this.$emit('player-play', { id: this.id })
    },
    playerPauseHandler () {
      this.playerStatus = 'pause'
      this.$emit('player-pause', { id: this.id })
    },
    playerStopHandler () {
      this.playerStatus = 'stop'
      if (this.messages.length) {
        this.playerValue = Math.floor(this.messages[0].timestamp)
      } else {
        this.playerValue = 0
      }
      this.$emit('player-stop', { id: this.id })
    },
    playerSpeedHandler (speed) {
      this.$emit('player-speed', { id: this.id, speed })
    },
    viewMessageHandler () {
      if (this.$refs.player && this.playerStatus !== 'stop') {
        this.$refs.player.stop()
      }
    },
    viewOnMapHandler (content) {
      this.$emit('view-on-map', content)
    }
  },
  watch: {
    playerValue (value, prev) {
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
      if (!isEquilPrevTimestamp) {
        this.update(currentTimestamp)
      }
    },
    player: {
      deep: true,
      handler (player) {
        if (this.activeMessagesIndexes && this.activeMessagesIndexes[0] !== player.currentMsgIndex) {
          this.activeMessagesIndexes = [player.currentMsgIndex]
        }
      }
    },
    needShowMessages (val) {
      this.messagesFlag = val
    },
    date () {
      this.playerValue = 0
      this.playerStatus = 'stop'
    }
  },
  components: { Messages, Player }
}
</script>
