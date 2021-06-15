<template>
  <div v-if="$store.state.offline || $store.state.socketOffline" class="offline-page window-height window-width bg-light column items-center no-wrap">
    <div class="offline-back">
      <div class="offline-code"></div>
      <div class="offline-line">
        <span v-for="n in Array(20)" :key="n">offline</span>
      </div>
    </div>
  </div>
</template>

<script>
/* for copying that components need to copy 'checkConnection' action, to add 'offline' property to root state */
/* and pictures 'corpse.png' and 'police50.png' must be in statics folder of project */
/* prop logo must be in relative path that component */

export default {
  name: 'offline',
  data () {
    return {
      intervalId: 0
    }
  },
  created () {
    this.intervalId = setInterval(() => { this.$store.dispatch('checkConnection') }, 5000)
  }
}
</script>

<style lang="stylus">
  .offline-page
    position absolute
    top 0
    bottom 0
    left 0
    right 0
    z-index 10020
    opacity .7
    background-image url(../../public/trackit.png)
    .offline-back
      width 100%
      height 100vh
      overflow hidden
      font-size 10vmax
      background-image url(../../public/corpse.png)
      background-position center 100px
      background-size contain
      background-repeat no-repeat
      background-color #333
      color rgba(255,255,255,0.7)
      .offline-code
        height 50vh
        width: 80vw;
        max-width: 600px;
        background-position center
        background-size contain
        background-repeat no-repeat
        margin 0 auto
      .offline-line
        overflow hidden
        width 160%
        transform rotate(-20deg) translate(-50%)
        background-color #ff0
        background-image url(../../public/police50.png)
        margin -30% 50%
        font-size 3rem
        & > span
          margin 10rem
          padding 0 20px
          text-transform uppercase
          font-weight bold
          color: #000
          background-color #ff0
</style>
