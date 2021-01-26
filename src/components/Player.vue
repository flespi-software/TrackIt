<template>
  <div style="display: flex; background-color: #424242; width: 100%">
    <q-btn :disable="max <= min" class="text-white" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat>
      x{{currentSpeed}}
      <q-menu ref="currentSpeedPopover" anchor="top left" style="background-color: #424242">
        <div class="column">
          <q-btn class="text-white bg-grey-9 no-border-radius full-width" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="changeSpeed(100)">x100</q-btn>
          <q-btn class="text-white bg-grey-9 no-border-radius full-width" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="changeSpeed(70)">x70</q-btn>
          <q-btn class="text-white bg-grey-9 no-border-radius full-width" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="changeSpeed(50)">x50</q-btn>
          <q-btn class="text-white bg-grey-9 no-border-radius full-width" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="changeSpeed(30)">x30</q-btn>
          <q-btn class="text-white bg-grey-9 no-border-radius full-width" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="changeSpeed(10)">x10</q-btn>
          <q-btn class="text-white bg-grey-9 no-border-radius full-width" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="changeSpeed(1)">x1</q-btn>
        </div>
      </q-menu>
      <q-tooltip v-if="$q.platform.is.desktop">currentSpeed</q-tooltip>
    </q-btn>
    <q-btn
      :color="currentStatus === 'play' ? 'blue' : 'white'"
      :disable="max <= min" class="text-white"
      :dense="$q.platform.is.mobile"
      :size="$q.platform.is.desktop ? '1.4rem' : 'md'"
      :icon="currentStatus === 'play' ? repeatFlag ? 'mdi-repeat' : 'mdi-pause' : 'mdi-play'"
      flat
      @click="playClickHandler"
      @click.ctrl="playRepeatClickHandler"
      v-touch-hold.noMouse="playRepeatClickHandler"
    >
      <q-tooltip v-if="$q.platform.is.desktop">Play/Pause (Ctrl+Click to repeat)</q-tooltip>
      <q-tooltip v-if="$q.platform.is.mobile">Play/Pause (Touch hold to repeat)</q-tooltip>
    </q-btn>
    <q-btn
      color="white" class="text-white"
      :disable="max <= min"
      :dense="$q.platform.is.mobile"
      :size="$q.platform.is.desktop ? '1.4rem' : 'md'"
      icon="mdi-stop"
      flat
      @click="stop"
    >
      <q-tooltip v-if="$q.platform.is.desktop">Stop</q-tooltip>
    </q-btn>
    <q-btn :disable="max <= min || mode === 'data'" class="text-white" icon="mdi-skip-previous" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="$emit('player-prev')">
      <q-tooltip v-if="$q.platform.is.desktop">Prev message</q-tooltip>
    </q-btn>
    <div class="player">
      <div class="player__main">
        <div class="player__container" style="transform: translate3d(0,0,0)" ref="playerContainer">
          <q-range v-if="max > min && mode === 'time'" color="white" v-model="range" :min="min" :max="max" :step="1"/>
          <div class="player__line cursor-pointer" :class="{disabled: max <= min  || mode === 'data'}" @click="clickLineHandler">
            <div class="line line__disabled line__disabled--left" :style="{width: `${(100 * (rangeMin - min)) / (max - min)}%`}"></div>
            <div class="line line__active" :style="{left: `${mode === 'time' ? current : 0}%`, width: `${100 - (mode === 'time' ? current : 0) - 100 / max * (max - rangeMax)}%`}"></div>
            <div class="line line__disabled line__disabled--right" :style="{width: `${100 / (max - min) * (max - rangeMax)}%`}"></div>
          </div>
          <div :style="{left: `${mode === 'time' ? current : 0}%`}" v-touch-pan.horizontal.mouse="dragPlayerControl" class="player__control cursor-pointer" :class="{'player__control--mobile': $q.platform.is.mobile, disabled: max <= min || mode === 'data'}"></div>
        </div>
      </div>
    </div>
    <q-btn :disable="max <= min || mode === 'data'" class="text-white" icon="mdi-skip-next" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :dense="$q.platform.is.mobile" flat @click="$emit('player-next')">
      <q-tooltip v-if="$q.platform.is.desktop">Next message</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
export default {
  name: 'Player',
  props: [
    'min',
    'max',
    'value',
    'status',
    'speed',
    'mode'
  ],
  data () {
    return {
      currentStatus: this.status,
      currentValue: this.value,
      rangeMin: this.min,
      rangeMax: this.max,
      timer: 0,
      currentMode: this.mode,
      currentSpeed: this.speed,
      percentsByPixel: 0,
      current: 0,
      repeatFlag: false
    }
  },
  computed: {
    range: {
      get () {
        return {
          min: this.rangeMin,
          max: this.rangeMax
        }
      },
      set (range) {
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
      }
    }
  },
  mounted () {
    if (this.$refs.playerContainer) {
      this.percentsByPixel = 100 / this.$refs.playerContainer.offsetWidth
    }
  },
  watch: {
    currentValue: throttle(
      function (value) {
        this.$emit('input', Math.round(value))
      },
      100,
      { trailing: true }
    ),
    currentSpeed: debounce(
      function (value) {
        this.$refs.currentSpeedPopover.hide()
        if (this.currentStatus === 'play') {
          this.pause()
          this.$nextTick(this.play)
        }
      },
      100
    ),
    value (value) {
      const current = (value - this.min) / (this.max - this.min) * 100
      this.checkNeedRedraw(current)
      if (value === this.currentValue) {
        return false
      }
      this.currentValue = value
    },
    min (val, prev) {
      if (this.rangeMin === prev) {
        this.rangeMin = val
      }
    },
    max (val, prev) {
      if (this.rangeMax === prev) {
        this.rangeMax = val
      }
    },
    status (status, old) {
      if (status !== this.currentStatus) {
        this.currentStatus = status
        if (status === 'play' || status === 'pause') {
          this.playClickHandler()
        }
        if (status === 'stop') {
          this.stop()
        }
      }
    },
    mode (mode) {
      this.currentMode = mode
      this.current = 0
      this.currentValue = this.min
      if (this.timer) { clearInterval(this.timer) }
    }
  },
  methods: {
    checkNeedRedraw (newVal) {
      if (Math.abs(newVal - this.current) >= this.percentsByPixel) {
        this.current = newVal
      }
    },
    playRepeatClickHandler () {
      this.repeatFlag = !this.repeatFlag
      if (this.currentStatus === 'pause') {
        this.playClickHandler()
      }
    },
    playClickHandler () {
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
    emit (event) {
      if (status === this.currentStatus) { return }
      this.$emit(`player-${event}`)
    },
    stop () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = 0
        if (this.currentStatus === 'play') {
          this.currentStatus = 'stop'
          this.currentValue = this.min
        }
      }
      this.emit('stop')
    },
    changeCurrent () {
      const current = this.currentValue + 1
      if (current > this.rangeMax) {
        this.pause()
        return false
      }
      this.currentValue = current
    },
    changeSpeed (currentSpeed) {
      this.currentSpeed = currentSpeed
      this.$emit('player-speed', currentSpeed)
    },
    play () {
      if (this.currentStatus === 'pause' || this.currentStatus === 'stop') {
        this.currentStatus = 'play'
        this.emit('play')
      }
      if (this.currentValue === this.max) {
        this.currentValue = this.min
      }
      this.timer = setInterval(this.changeCurrent, 1000 / this.currentSpeed)
    },
    pause () {
      if (this.repeatFlag) {
        if (this.currentValue === this.max) {
          setTimeout(() => { this.currentValue = this.min }, 600)
          return false
        }
      }
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = 0
        if (this.currentStatus === 'play') {
          this.end()
          this.currentStatus = 'pause'
          this.emit('pause')
        }
      }
    },
    end () {
      if (this.value !== this.currentValue) {
        setTimeout(() => { this.$emit('input', this.currentValue) }, 100)
      }
    },
    getPlayerParams () {
      const container = this.$refs.playerContainer,
        left = container.getBoundingClientRect().left,
        width = container.offsetWidth,
        step = width / (this.max - this.min)
      return {
        left, width, step
      }
    },
    dragPlayerControl (data) {
      if (this.max <= this.min || this.mode === 'data') {
        return false
      }
      const { left, step } = this.getPlayerParams()
      let position = this.min + ((data.position.left - left) / step)
      if (position < this.rangeMin) {
        position = this.rangeMin
      }
      if (position > this.rangeMax) {
        position = this.rangeMax
      }
      this.currentValue = data.isFinal ? Math.round(position) : position
    },
    clickLineHandler (ev) {
      if (this.max <= this.min || this.mode === 'data') {
        return false
      }
      const x = ev.clientX,
        { left, step } = this.getPlayerParams(),
        current = this.min + ((x - left) / step)
      if (this.currentValue !== current) {
        if (current < this.rangeMin || current > this.rangeMax) {
          return false
        }
        this.currentValue = Math.round(current)
      }
    }
  },
  beforeDestroy () {
    this.stop()
  }
}
</script>

<style lang="stylus">
  .no-border-radius
    border-radius none
  .player
    width 100%
    padding 0 17px
    overflow hidden
    .player__main
      height calc(100% - 18px)
      position relative
      margin-top: 10px
      .player__container
        height 100%
        position relative
        .player__line
          height 16%
          top calc(50% - 8%)
          width 100%
          position absolute
          background-color #00b0ff
          transition all .2s ease
          .line
            height 100%
            position absolute
            &__active
              background-color white
            &__disabled
              background-color #666
              cursor default
              &--left
                left 0
              &--right
                top 0
                right 0
        .player__control
          width 24px
          height 24px
          border-radius 50%
          background-color rgba(0,255,0,.8)
          border solid 1px white
          position absolute
          top calc(50% - 1px)
          transform translate3d(-50%, -50%, 0) rotate(-135deg)
          border-bottom-left-radius inherit
          z-index 2
          &--mobile
            width 16px
            height 16px
            top 50%
      .q-slider
        height 7px
        top 20px
        .q-slider__thumb-container
          top 50%
          z-index 1
          .q-slider__thumb
            &.handle-at-minimum:after
              border none
        .q-slider__track-container
          display none
</style>
