<template>
  <div :style="[{height: height, position: 'relative'}]">
    <div class="no-messages text-center" v-if="!messages.length && needShowMessages">
      <div class="text-white" style="font-size: 3rem;">
        <div>No messages</div>
        <div style="font-size: 1.5rem;">or position is empty</div>
      </div>
      <q-btn color="dark" v-if="isAdmin && mode === 1" @click="$emit('send', id)">Send message</q-btn>
    </div>
    <div :style="{height: messages.length > 1 && mode === 0 && needShowPlayer ? 'calc(100% - 65px)' : '100%'}" class="table__wrapper" v-if="messages.length && needShowMessages">
      <messages
        :messages="messages"
        :mode="mode"
        :item="device"
        :activeDeviceId="id"
        :limit="0"
        :date="date"
        :activeMessagesIds="activeMessagesIndexes"
        @view="viewMessageHandler"
        @view-on-map="viewOnMapHandler"
      ></messages>
    </div>
    <div
      style="display: flex; background-color: #424242;"
      :style="{height: mode === 0 && needShowMessages ? '65px' : '100%'}"
      v-if="mode === 0 && needShowPlayer"
    >
      <q-btn
        icon="more_vert"
        color="white"
        class="btn-less-padding"
        size="md"
        flat
        v-if="$q.platform.is.mobile"
      >
        <q-popover ref="popoverExtra">
          <q-list link separator class="scroll" style="min-width: 200px">
            <q-item>
              <q-toggle @input="$emit('change:needShowMessages', messagesFlag)" v-model="messagesFlag" icon="dvr" label="Messages" />
            </q-item>
            <q-item>
              <q-toggle @input="$emit('change:needShowTail', needPolyline)" v-model="needPolyline" icon="mdi-ray-end" label="Tail" />
            </q-item>
          </q-list>
        </q-popover>
      </q-btn>
      <q-btn
        icon="mdi-ray-end"
        :color="needPolyline ? 'blue' : 'white'"
        :class="{'btn-less-padding': !$q.platform.is.desktop }"
        :size="$q.platform.is.desktop ? '1.4rem' : 'md'"
        flat
        @click="needPolyline = !needPolyline, $emit('change:needShowTail', needPolyline)"
        v-if="$q.platform.is.desktop"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Tail</q-tooltip>
      </q-btn>
      <q-btn
        icon="dvr"
        :color="needShowMessages ? 'blue' : 'white'"
        :class="{'btn-less-padding': !$q.platform.is.desktop }"
        :size="$q.platform.is.desktop ? '1.4rem' : 'md'"
        flat
        @click="messagesFlag = !messagesFlag, $emit('change:needShowMessages', messagesFlag)"
        v-if="$q.platform.is.desktop"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Messages</q-tooltip>
      </q-btn>
      <player
        ref="player"
        v-model="playerValue"
        :min="timeRange.min"
        :max="timeRange.max"
        @next="playerNextHandler"
        @prev="playerPrevHandler"
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
    'mode',
    'date',
    'isAdmin',
    'device',
    'needShowMessages',
    'needShowPlayer'
  ],
  data () {
    return {
      playerValue: 0,
      activeMessagesIndexes: [],
      needPolyline: false,
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
        let key = Math.floor(message.timestamp)
        if (!result[key]) {
          result[key] = []
        }
        result[key].push(index)
        return result
      }, {})
    },
    height () {
      if (this.mode === 0 && !!this.messages.length) {
        if (this.needShowMessages && !this.needShowPlayer) {
          return '20vh'
        } else if (!this.needShowMessages && this.needShowPlayer) {
          return '65px'
        } else {
          return '30vh'
        }
      } else {
        if (this.needShowMessages && this.needShowPlayer) {
          return '205px'
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
      let currentTimestamp = 0,
        timestamps = Object.keys(this.indexesByTimestamp)
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
      this.$emit('play', {id: this.id, messagesIndexes: this.indexesByTimestamp[timestamp]})
      this.activeMessagesIndexes = this.indexesByTimestamp[timestamp]
    },
    playerNextHandler () {
      let timestamps = Object.keys(this.indexesByTimestamp),
        index = timestamps.indexOf(this.getCurrentActiveTimestamp())
      if (index === timestamps.length - 1) {
        this.$q.notify({
          message: 'That`s last message',
          type: 'info',
          position: 'bottom-left'
        })
        return false
      }
      this.playerValue = timestamps[index + 1]
    },
    playerPrevHandler () {
      let timestamps = Object.keys(this.indexesByTimestamp),
        index = timestamps.indexOf(this.getCurrentActiveTimestamp())
      if (index === 0) {
        this.$q.notify({
          message: 'That`s first message',
          type: 'info',
          position: 'bottom-left'
        })
        return false
      }
      this.playerValue = timestamps[index - 1]
    },
    viewMessageHandler () {
      if (this.$refs.player) {
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
        isEquilPrevTimestamp = true,
        timestamps = Object.keys(this.indexesByTimestamp)
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
    needShowMessages (val) {
      this.messagesFlag = val
    },
    messages (messages) {
      if (this.mode === 0 && messages.length) {
        let currentTimestamp = Math.floor(messages[0].timestamp)
        this.playerValue = messages.length ? Math.floor(messages[0].timestamp) : 0
        this.update(currentTimestamp)
      }
    }
  },
  components: {Messages, Player},
  beforeDestroy () {
    if (this.mode === 0 && this.messages.length) {
      let currentTimestamp = Math.floor(this.messages[this.messages.length - 1].timestamp)
      this.update(currentTimestamp)
    }
  },
  created () {
    if (this.mode === 0 && this.messages.length) {
      let currentTimestamp = Math.floor(this.messages[0].timestamp)
      this.playerValue = this.messages.length ? Math.floor(this.messages[0].timestamp) : 0
      this.update(currentTimestamp)
    }
  }
}
</script>

<style lang="stylus">
  .btn-less-padding
    padding 4px 5px
</style>
