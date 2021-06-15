<template>
  <div class="login-page window-height window-width bg-light column items-center no-wrap">
    <a v-if="!$q.platform.is.mobile || !$q.platform.within.iframe" href="https://github.com/flespi-software/TrackIt/" target="_blank"><img style="position: absolute; top: 0; right: 0; border: 0; width: 149px; height: 149px;" src="right-graphite@2x.png" alt="Fork me on GitHub"></a>
    <div class="login-back flex items-center justify-center">
      <div class="login-code flex items-center justify-center">
        Track it!
      </div>
    </div>
    <div v-if="!$route.params.token">
      <div class="login-card shadow-4 bg-white column items-center justify-center no-wrap">
        <p class="text-center">Track your devices on the map.</p>
        <div class="row full-width">
          <div class="col-12 text-center">
            <q-btn @click="openWindow(`${$authHost}/login/#/providers`)" icon="mdi-account-circle" color="red-7" rounded label="login / register" size="lg"/>
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
import { mapMutations, mapActions } from 'vuex'
import { getFromStore } from '../mixins/store'

export default {
  data () {
    return {
      token: '',
      offlineIntervalId: 0,
      icons: {
        facebook: 'mdi-facebook-box',
        google: 'mdi-google-plus-box',
        live: 'mdi-windows',
        github: 'mdi-github-box',
        email: 'mdi-at'
      }
    }
  },
  computed: {
    model: {
      get () {
        return this.token
      },
      set (val) {
        this.token = val
      }
    }
  },
  methods: {
    ...mapMutations(['setRegions', 'setCurrentRegion', 'setToken']),
    ...mapActions(['initConnection']),
    logIn (region) {
      this.initConnection({ token: this.token, region })
        .then(() => {
          this.$nextTick(() => { this.$router.push('/') })
        })
    },
    autoLogin () {
      this.initConnection({ token: this.$route.params.token })
        .then(() => {
          this.$router.push('/')
        })
    },
    checkHasToken () {
      const sessionStorageToken = getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'token' })
      const sessionStorageRegion = getFromStore({ store: this.$q.sessionStorage, storeName: this.$store.state.storeName, name: 'region' })
      if (this.$route.params && this.$route.params.token) {
        this.autoLogin()
        return true
      } else if (sessionStorageToken) {
        this.token = sessionStorageToken
        this.logIn(sessionStorageRegion)
        return true
      } else { return false }
    },
    openWindow (url, title) {
      title = title || 'auth'
      const w = 500, h = 600
      const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left
      const dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top

      const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width
      const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height

      const left = ((width / 2) - (w / 2)) + dualScreenLeft
      const top = ((height / 2) - (h / 2)) + dualScreenTop
      const newWindow = window.open(url, title, 'toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left)

      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus()
      }
    },
    regionInitFromAuth (region) {
      this.setRegions({ [region.name]: region })
      this.setCurrentRegion(region)
      this.$connector.setRegion(region)
    }
  },
  watch: {
    $route (val) {
      if (val.params && val.params.token) {
        this.autoLogin()
      }
    }
  },
  created () {
    if (!this.checkHasToken()) {
      const tokenHandler = (event) => {
        if (typeof event.data === 'string' && ~event.data.indexOf('FlespiLogin|token:')) {
          let payload = event.data
          payload = payload.replace('FlespiLogin|token:', '')
          payload = JSON.parse(payload)
          this.token = payload.token
          this.regionInitFromAuth(payload.region)
          this.setToken(payload.token)
          this.$router.push('/')
          window.removeEventListener('message', tokenHandler)
        }
      }
      window.addEventListener('message', tokenHandler)
    }
  }
}
</script>

<style lang="stylus">
  .row__wrapper
    height 80px
  .login-page
    .login-back
      width 100%
      height 50vh
      overflow hidden
      font-size 8vmax
      background-image url(../../public/mountain.svg)
      background-position center 100px
      background-size contain
      background-repeat no-repeat
      background-color #333
      color rgba(255,255,255,0.9)
      .login-code
        height 50vh
        width: 80vw;
        max-width: 600px;
        background-image url(../..//public/trackit.png)
        background-position center
        background-size contain
        background-repeat no-repeat
        opacity .8
        padding-top 20vh
        font-size 80%
    .login-card
      border-radius 2px
      margin-top -50px
      width 80vw
      max-width 600px
      padding 25px
      > i
        font-size 5rem
</style>
