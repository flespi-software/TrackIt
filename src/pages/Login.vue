<template>
  <div class="login-page window-height window-width bg-light column items-center no-wrap">
    <a
      v-if="!$q.platform.is.mobile || !$q.platform.within.iframe"
      href="https://github.com/flespi-software/TrackIt/"
      target="_blank"
    >
      <img class="login-github-link" src="right-graphite@2x.png" alt="Fork me on GitHub" />
    </a>
    <div class="login-back flex items-center justify-center">
      <div class="login-code flex items-center justify-center">Track it!</div>
    </div>
    <div style="width: 100%; height: 50vh; background-color: white" />
    <div v-if="!$route.params.token" style="position: absolute; top: 50%">
      <div class="login-card shadow-4 bg-white column items-center justify-center no-wrap">
        <p class="text-center">Track your devices on the map.</p>
        <div class="row full-width">
          <div class="col-12 text-center">
            <q-btn
              rounded
              icon="mdi-account-circle"
              label="login / register"
              color="red-7"
              size="lg"
              @click="openLoginRegisterWindow(`${host}/login/#/providers`)"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="login-card shadow-4 bg-white column items-center justify-center no-wrap">
        <q-circular-progress indeterminate color="positive" style="width: 100%; height: 45px" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useMiscStore } from '../stores/misc'

export default defineComponent({
  name: 'LoginPage',
  data() {
    return {}
  },
  computed: {
    ...mapState(useAuthStore, {
      host: function (store) {
        if (store.$region && store.$region.rest) {
          /* store.$region is to be already set in boot/flespi-io.js */
          return store.$region.rest
        } else {
          return window.location.hostname === 'localhost' ? 'https://localhost:9005' : 'https://flespi.io'
        }
      },
      token: (store) => store.token,
    }),
  },
  methods: {
    ...mapActions(useAuthStore, ['initConnection', 'setToken']),
    ...mapActions(useMiscStore, ['getFromStore']),
    openLoginRegisterWindow(url, title) {
      title = title || 'auth'
      const w = 500,
        h = 600
      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top

      const width = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
          ? document.documentElement.clientWidth
          : screen.width
      const height = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
          ? document.documentElement.clientHeight
          : screen.height

      const left = width / 2 - w / 2 + dualScreenLeft
      const top = height / 2 - h / 2 + dualScreenTop
      const newWindow = window.open(
        url,
        title,
        'toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width=' +
          w +
          ', height=' +
          h +
          ', top=' +
          top +
          ', left=' +
          left,
      )

      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus()
      }
    },
  },
  watch: {
    $route(route) {
      if (route.params && route.params.token) {
        console.log('[watch route]: token')
        this.setToken(this.$route.params.token).then(() => {
          this.$nextTick(() => {
            this.$router.push('/')
          })
        })
      }
    },
  },
  created() {
    // first try to login with the token that is passed in URL, if any
    if (this.$route.params && this.$route.params.token) {
      console.log('[login]: route params token')
      const nextPath = this.$route.params.devices ? '/devices/' + this.$route.params.devices : '/'
      this.setToken(this.$route.params.token).then(() => {
        this.$nextTick(() => {
          this.$router.push(nextPath)
        })
      })
      return true
    }
    // second try to login with the token stored in session storage, if any
    const sessionStorageToken = this.getFromStore({ store: this.$q.sessionStorage, name: 'token' })
    if (sessionStorageToken) {
      console.log('[login]: session storage token')
      this.setToken(sessionStorageToken).then(() => {
        this.$nextTick(() => {
          this.$router.push('/')
        })
      })
      return true
    }
    // finally create message listener for receiving a token from login/register window
    const tokenHandler = (event) => {
      /*
      event.data format:
      FlespiLogin|token:{"token":"CrcMV9EEiwLnlhf9GVQC6ObIxJcaDfEOeTHr5KL3rPDb63p5gFeo8EOlreMAebBp","region":{"cdn":"https://cdn.flespi.io","default":true,"gw":"gw.flespi.io","gw-ftp":"{channel-address}:21","gw-ip":"185.213.2.30","media":"https://media.flespi.io","mqtt":"mqtt.flespi.io:8883","mqtt-ws":"mqtt.flespi.io:443","name":"eu","registration-allowed":true,"rest":"https://flespi.io"}}
      */
      if (typeof event.data === 'string' && ~event.data.indexOf('FlespiLogin|token:')) {
        let payload = event.data
        payload = payload.replace('FlespiLogin|token:', '')
        payload = JSON.parse(payload)

        console.log('[login]: token from login/register window')
        this.setToken(payload.token).then(() => {
          this.$nextTick(() => {
            this.$router.push('/')
          })
        })
        window.removeEventListener('message', tokenHandler)
      }
    }
    window.addEventListener('message', tokenHandler)
  },
})
</script>

<style lang="sass">
.row__wrapper
  height: 80px
.login-page
  .login-github-link
    position: absolute
    top: 0
    right: 0
    border: 0
    width: 149px
    height: 149px
  .login-back
    width: 100%
    height: 50vh
    overflow: hidden
    font-size: 8vmax
    background-image: url(/mountain.svg)
    background-position: center 100px
    background-size: contain
    background-repeat: no-repeat
    background-color: #333
    color: rgba(255,255,255,0.9)
    .login-code
      height: 50vh
      width: 80vw
      max-width: 600px
      background-image: url(/trackit.png)
      background-position: center
      background-size: contain
      background-repeat: no-repeat
      opacity: .8
      padding-top: 20vh
      font-size: 80%
  .login-card
    border-radius: 2px
    margin-top: -50px
    width: 80vw
    max-width: 600px
    padding: 25px
    > i
      font-size: 5rem
</style>
