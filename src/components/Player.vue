<template>
  <div style="display: flex; background-color: #424242; width: 100%">
    <q-btn :disable="max <= min" class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat>
      x{{speed}}
      <q-popover ref="speedPopover" anchor="top left" style="background-color: #424242">
        <div class="column">
          <q-btn class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="speed = 100">x100</q-btn>
          <q-btn class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="speed = 70">x70</q-btn>
          <q-btn class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="speed = 50">x50</q-btn>
          <q-btn class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="speed = 30">x30</q-btn>
          <q-btn class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="speed = 10">x10</q-btn>
          <q-btn class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="speed = 1">x1</q-btn>
        </div>
      </q-popover>
      <q-tooltip v-if="$q.platform.is.desktop">Speed</q-tooltip>
    </q-btn>
    <q-btn :color="status === 'play' ? 'blue' : 'white'" :disable="max <= min" class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" :icon="status === 'play' ? repeatFlag ? 'mdi-repeat' : 'mdi-pause' : 'mdi-play'" flat @click="playClickHandler" @click.ctrl="playRepeatClickHandler">
      <q-tooltip v-if="$q.platform.is.desktop">Play/Pause (Ctrl+Click to repeat)</q-tooltip>
    </q-btn>
    <q-btn :disable="max <= min" class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" icon="mdi-skip-previous" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="$emit('prev')">
      <q-tooltip v-if="$q.platform.is.desktop">Prev message</q-tooltip>
    </q-btn>
    <div class="player">
      <div class="player__main">
        <div class="player__container" style="transform: translate3d(0,0,0)" ref="playerContainer">
          <q-range v-if="max > min" color="white" square v-model="range" :min="min" :max="max" :step="1"/>
          <div class="player__line cursor-pointer" :class="{disabled: max <= min}" @click="clickLineHandler">
            <div class="line line__disabled line__disabled--left" :style="{width: `${(100 * (rangeMin - min)) / (max - min)}%`}"></div>
            <div class="line line__active" :style="{left: `${current}%`, width: `${100 - current - 100 / max * (max - rangeMax)}%`}"></div>
            <div class="line line__disabled line__disabled--right" :style="{width: `${100 / (max - min) * (max - rangeMax)}%`}"></div>
          </div>
          <div :style="{left: `${current}%`}" v-touch-pan.horizontal="dragPlayerControl" class="player__control cursor-pointer" :class="{'player__control--mobile': $q.platform.is.mobile, disabled: max <= min}"></div>
        </div>
      </div>
    </div>
    <q-btn :disable="max <= min" class="text-white" :class="{'btn-less-padding': !$q.platform.is.desktop }" icon="mdi-skip-next" :size="$q.platform.is.desktop ? '1.4rem' : 'md'" flat @click="$emit('next')">
      <q-tooltip v-if="$q.platform.is.desktop">Next message</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import { debounce, throttle } from 'quasar'
export default {
  name: 'Player',
  props: [
    'min',
    'max',
    'value'
  ],
  data () {
    return {
      status: 'pause',
      currentValue: this.value,
      rangeMin: this.min,
      rangeMax: this.max,
      timer: 0,
      speed: 10,
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
        this.stop()
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
      100
    ),
    speed: debounce(
      function (value) {
        this.$refs.speedPopover.hide()
        if (this.status === 'play') {
          this.stop()
          this.$nextTick(this.play)
        }
      },
      100
    ),
    value (value) {
      let current = (value - this.min) / (this.max - this.min) * 100
      this.checkNeedRedraw(current)
      if (value === this.currentValue) {
        return false
      }
      this.currentValue = value
    },
    min (val) {
      this.rangeMin = val
    },
    max (val) {
      this.rangeMax = val
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
      if (this.status === 'pause') {
        this.playClickHandler()
      }
    },
    playClickHandler () {
      switch (this.status) {
        case 'pause': {
          this.play()
          break
        }
        case 'play': {
          this.stop()
          break
        }
      }
    },
    changeCurrent () {
      let current = this.currentValue + 1
      if (current > this.rangeMax) {
        this.stop()
        return false
      }
      this.currentValue = current
    },
    play () {
      if (this.status === 'pause') {
        this.status = 'play'
      }
      if (this.currentValue === this.max) {
        this.currentValue = this.min
      }
      this.timer = setInterval(this.changeCurrent, 1000 / this.speed)
    },
    stop () {
      if (this.repeatFlag) {
        this.repeatFlag = false
        if (this.currentValue === this.max) {
          this.currentValue = this.min
          return false
        }
      }
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = 0
        if (this.status === 'play') {
          this.end()
          this.status = 'pause'
        }
      }
    },
    end () {
      if (this.value !== this.currentValue) {
        setTimeout(() => { this.$emit('input', this.currentValue) }, 100)
      }
    },
    getPlayerParams () {
      let container = this.$refs.playerContainer,
        left = container.getBoundingClientRect().left,
        width = container.offsetWidth,
        step = width / (this.max - this.min)
      return {
        left, width, step
      }
    },
    dragPlayerControl (data) {
      if (this.max <= this.min) {
        return false
      }
      let {left, step} = this.getPlayerParams(),
        position = this.min + ((data.position.left - left) / step)
      if (position < this.rangeMin) {
        position = this.rangeMin
      }
      if (position > this.rangeMax) {
        position = this.rangeMax
      }
      this.currentValue = data.isFinal ? Math.round(position) : position
    },
    clickLineHandler (ev) {
      if (this.max <= this.min) {
        return false
      }
      let x = ev.clientX,
        {left, step} = this.getPlayerParams(),
        current = this.min + ((x - left) / step)
      if (this.currentValue !== current) {
        if (current < this.rangeMin || current > this.rangeMax) {
          return false
        }
        this.currentValue = Math.round(current)
      }
    },
    beforeDestroy () {
      this.stop()
    }
  }
}
</script>

<style lang="stylus">
  .btn-less-padding
    padding 4px 5px
  .player
    width 100%
    padding 0 15px
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
          top calc(53% - 1px)
          transform translate3d(-50%, -50%, 0) rotate(-135deg)
          border-bottom-left-radius inherit
          z-index 2
          &--mobile
            width 16px
            height 16px
            top 53%
      .q-slider
        height 0
        .q-slider-handle-container
          position inherit
          .q-slider-handle
            top inherit
            height 100%
            width 4px
            transform translate3d(0, 0, 0)
            z-index 1
            &.handle-at-minimum:after
              border none
          .q-slider-track
            display none
</style>
