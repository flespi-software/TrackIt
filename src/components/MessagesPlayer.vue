<template>
  <div
    class="row"
    style="background-color: #424242"
    :style="{ height: needShowMessages ? 'auto' : '100%' }"
  >
    <div class="col-12 col-md-auto">
      <q-btn
        round
        flat
        icon="mdi-mail"
        :color="needShowMessages ? 'blue' : 'white'"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
        @click="$emit('switch-show-messages')"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Messages</q-tooltip>
      </q-btn>
      <q-btn
        round
        flat
        color="white"
        :icon="mode === 'time' ? 'mdi-map-clock-outline' : 'mdi-map-marker-distance'"
        :disable="max <= min || status === 'play'"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
        @click="$emit('switch-player-mode')"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Change mode (Time/Data)</q-tooltip>
      </q-btn>
      <q-btn
        flat
        class="text-white"
        :disable="max <= min"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
      >
        <span :style="{ width: $q.platform.is.desktop ? '28px' : '28px' }"
          >x{{ currentSpeed }}</span
        >
        <q-menu ref="currentSpeedPopover" anchor="top left" style="background-color: #424242">
          <div style="width: 66px">
            <q-btn
              flat
              v-for="speed in [100, 70, 50, 30, 10, 1]"
              :key="speed"
              class="text-white bg-grey-9 no-border-radius full-width"
              :size="$q.platform.is.desktop ? '1rem' : 'md'"
              @click="changeSpeed(speed)"
            >
              x{{ speed }}
            </q-btn>
          </div>
        </q-menu>
        <q-tooltip v-if="$q.platform.is.desktop">Player speed</q-tooltip>
      </q-btn>
      <q-btn
        round
        flat
        v-touch-hold.noMouse="playRepeatClickHandler"
        :color="currentStatus === 'play' ? 'blue' : 'white'"
        :disable="max <= min"
        class="text-white"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
        :icon="currentStatus === 'play' ? (repeatFlag ? 'mdi-repeat' : 'mdi-pause') : 'mdi-play'"
        @click="playClickHandler"
        @click.ctrl="playRepeatClickHandler"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Play/Pause (Ctrl+Click to repeat)</q-tooltip>
        <q-tooltip v-if="$q.platform.is.mobile">Play/Pause (Touch hold to repeat)</q-tooltip>
      </q-btn>
      <q-btn
        round
        flat
        icon="mdi-stop"
        color="white"
        class="text-white"
        :disable="max <= min"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
        @click="stop"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Stop</q-tooltip>
      </q-btn>
    </div>
    <div class="col-12 col-md relative-position">
      <q-btn
        round
        flat
        class="absolute-left text-white"
        icon="mdi-skip-previous"
        :disable="max <= min || mode === 'data'"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
        @click="$emit('player-prev')"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Prev message</q-tooltip>
      </q-btn>
      <div class="player">
        <div class="player__main">
          <div
            class="player__container"
            style="transform: translate3d(0, 0, 0)"
            ref="playerContainer"
          >
            <q-range
              v-if="max > min && mode === 'time'"
              v-model="range"
              color="white"
              :min="min"
              :max="max"
              :step="1"
            />
            <div
              class="player__line cursor-pointer"
              :class="{ disabled: max <= min || mode === 'data' }"
              @click="lineClickHandler"
            >
              <div
                class="line line__disabled line__disabled--left"
                :style="{ width: `${(100 * (rangeMin - min)) / (max - min)}%` }"
              />
              <div
                class="line line__active"
                :style="{
                  left: `${mode === 'time' ? current : 0}%`,
                  width: `${100 - (mode === 'time' ? current : 0) - (max > 0 ? (100 / max) * (max - rangeMax) : 0)}%`,
                }"
              />
              <div
                class="line line__disabled line__disabled--right"
                :style="{ width: `${(100 / (max - min)) * (max - rangeMax)}%` }"
              />
            </div>
            <div
              :style="{ left: `${mode === 'time' ? current : 0}%` }"
              v-touch-pan.horizontal.mouse="dragPlayerControl"
              class="player__control cursor-pointer"
              :class="{
                'player__control--mobile': $q.platform.is.mobile,
                'player__control--disabled': max <= min || mode === 'data',
                disabled: max <= min || mode === 'data',
              }"
            />
          </div>
        </div>
      </div>
      <q-btn
        round
        flat
        class="absolute-right text-white"
        icon="mdi-skip-next"
        :disable="max <= min || mode === 'data'"
        :size="$q.platform.is.desktop ? '1rem' : 'md'"
        @click="$emit('player-next')"
      >
        <q-tooltip v-if="$q.platform.is.desktop">Next message</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { debounce, throttle } from 'quasar'

export default defineComponent({
  name: 'MessagesPlayer',
  emits: [
    'update:modelValue',
    'player-next',
    'player-pause',
    'player-play',
    'player-prev',
    'player-speed',
    'player-stop',
    'switch-player-mode',
    'switch-show-messages',
  ],
  props: [
    'min', // timestamp of the first message
    'max', // timestamp of the last message
    'mode', // player mode: time/date
    'modelValue', // current timestamp of the player
    'needShowMessages',
    'speed',
    'status', // player status that come from MapContaier>Queue>QueueItem as property
  ],
  data() {
    return {
      current: 0,
      currentSpeed: this.speed,
      currentStatus: this.status, // current status of the player, before player status is updated for QueueItem>Queue>MapContainer
      currentValue: this.modelValue, // timestamp iterated from the beginning to the end of the range while playing
      percentsByPixel: 0,
      rangeMin: this.min,
      rangeMax: this.max,
      repeatFlag: false,
      timer: 0,
    }
  },
  computed: {
    range: {
      // timestamps range used as a model for q-range component
      get() {
        return {
          min: this.rangeMin,
          max: this.rangeMax,
        }
      },
      set(range) {
        this.pause()
        if (this.currentValue <= range.min) {
          this.currentValue = range.min
        }
        if (this.currentValue > range.max) {
          this.currentValue = range.max
          this.end()
        }
        this.rangeMin = range.min
        this.rangeMax = range.max
      },
    },
  },
  methods: {
    checkNeedRedraw(newVal) {
      if (Math.abs(newVal - this.current) >= this.percentsByPixel) {
        this.current = newVal
      }
    },
    changeCurrent() {
      const current = this.currentValue + 1
      if (current > this.rangeMax) {
        this.pause()
        return false
      }
      this.currentValue = current
    },
    changeSpeed(currentSpeed) {
      this.currentSpeed = currentSpeed
      this.$emit('player-speed', currentSpeed)
    },
    dragPlayerControl(data) {
      if (this.max <= this.min || this.mode === 'data') {
        return false
      }
      const { left, step } = this.getPlayerParams()
      let position = this.min + (data.position.left - left) / step
      if (position < this.rangeMin) {
        position = this.rangeMin
      }
      if (position > this.rangeMax) {
        position = this.rangeMax
      }
      this.currentValue = data.isFinal ? Math.round(position) : position
    },
    emitCurrentValue(value) {
      this.$emit('update:modelValue', Math.round(value))
    },
    end() {
      if (this.modelValue !== this.currentValue) {
        setTimeout(() => {
          this.$emit('update:modelValue', this.currentValue)
        }, 100)
      }
    },
    getPlayerParams() {
      const container = this.$refs.playerContainer,
        left = container.getBoundingClientRect().left,
        width = container.offsetWidth,
        step = width / (this.max - this.min)
      return {
        left,
        width,
        step,
      }
    },
    lineClickHandler(ev) {
      if (this.max <= this.min || this.mode === 'data') {
        return false
      }
      const x = ev.clientX,
        { left, step } = this.getPlayerParams(),
        current = this.min + (x - left) / step
      if (this.currentValue !== current) {
        if (current < this.rangeMin || current > this.rangeMax) {
          return false
        }
        this.currentValue = Math.round(current)
      }
    },
    pause() {
      if (this.repeatFlag) {
        if (this.currentValue === this.max) {
          setTimeout(() => {
            this.currentValue = this.min
          }, 600)
          return false
        }
      }
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = 0
        if (this.currentStatus === 'play') {
          this.end()
          this.currentStatus = 'pause'
          if (this.status !== this.currentStatus) {
            this.$emit('player-pause')
          }
        }
      }
    },
    play() {
      if (this.currentStatus === 'pause' || this.currentStatus === 'stop') {
        this.currentStatus = 'play'
        if (this.status !== this.currentStatus) {
          this.$emit('player-play')
        }
      }
      if (this.currentValue === this.max) {
        this.currentValue = this.min
      }
      this.timer = setInterval(this.changeCurrent, 1000 / this.currentSpeed)
    },
    playClickHandler() {
      switch (this.currentStatus) {
        case 'stop':
        case 'pause': {
          this.play()
          break
        }
        case 'play': {
          this.pause()
          break
        }
      }
    },
    playRepeatClickHandler() {
      this.repeatFlag = !this.repeatFlag
      if (this.currentStatus === 'pause') {
        this.playClickHandler()
      }
    },
    processChangedSpeed() {
      this.$refs.currentSpeedPopover.hide()
      if (this.currentStatus === 'play') {
        this.pause()
        this.$nextTick(this.play)
      }
    },
    stop() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = 0
      }
      if (this.currentStatus === 'play' || this.currentStatus === 'pause') {
        this.currentStatus = 'stop'
        this.currentValue = this.min
      }
      if (this.status !== this.currentStatus) {
        this.$emit('player-stop')
      }
    },
  },
  created() {
    this.debouncedProcessChangedSpeed = debounce(this.processChangedSpeed, 100)
    this.throttledEmitCurrentValue = throttle(this.emitCurrentValue, 100)
  },
  mounted() {
    if (this.$refs.playerContainer) {
      this.percentsByPixel = 100 / this.$refs.playerContainer.offsetWidth
    }
  },
  watch: {
    currentSpeed() {
      this.debouncedProcessChangedSpeed()
    },
    currentValue(value) {
      this.throttledEmitCurrentValue(value)
    },
    max(val, prev) {
      if (this.rangeMax === prev) {
        this.rangeMax = val
      }
    },
    min(val, prev) {
      if (this.rangeMin === prev) {
        this.rangeMin = val
      }
    },
    mode(mode) {
      this.currentMode = mode
      this.current = 0
      this.currentValue = this.min
      if (this.timer) {
        clearInterval(this.timer)
      }
    },
    modelValue(value) {
      const current = ((value - this.min) / (this.max - this.min)) * 100
      this.checkNeedRedraw(current)
      if (value === this.currentValue) {
        return false
      }
      this.currentValue = value
    },
  },
  beforeUnmount() {
    this.stop()
  },
})
</script>

<style lang="sass">
.no-border-radius
  border-radius: none
.player
  width: 100%
  height: 46px
  padding: 0 68px
  overflow: hidden
  .player__main
    height: calc(100% - 18px)
    position: relative
    margin-top: 10px
    .player__container
      height: 100%
      position: relative
      .player__line
        height: 16%
        top: calc(50% - 8%)
        width: 100%
        position: absolute
        background-color: #00b0ff
        transition: all .2s ease
        .line
          height: 100%
          position: absolute
          &__active
            background-color: white
          &__disabled
            background-color: #666
            cursor: default
            &--left
              left: 0
            &--right
              top: 0
              right: 0
      .player__control
        width: 24px
        height: 24px
        border-radius: 50%
        background-color: rgba(0,255,0,.8)
        border: solid 1px white
        position: absolute
        top: calc(50% - 1px)
        transform: translate3d(-50%, -50%, 0) rotate(-135deg)
        border-bottom-left-radius: inherit
        z-index: 2
        &--mobile
          width: 16px
          height: 16px
          top: 50%
        &--disabled
          background-color: rgba(100,100,100,.8)
    .q-slider
      height: 7px
      top: 20px
      .q-slider__thumb-container
        top: 50%
        z-index: 1
        .q-slider__thumb
          &.handle-at-minimum:after
            border: none
      .q-slider__track-container
        display: none
</style>
