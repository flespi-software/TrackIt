<template>
  <div class="login-page window-height window-width bg-light column items-center no-wrap">
    <a v-if="!$q.platform.is.mobile" href="https://github.com/flespi-software/TrackIt/" target="_blank"><img style="position: absolute; top: 0; right: 0; border: 0; width: 149px; height: 149px;" src="../statics/right-graphite@2x.png" alt="Fork me on GitHub"></a>
    <div class="login-back flex items-center justify-center">
      <div class="login-code flex items-center justify-center">
        Track it!
      </div>
    </div>
    <div v-if="!$route.params.token && !offline">
      <div class="login-card shadow-4 bg-white column items-center justify-center no-wrap">
        <p class="text-center">Track your devices on the map.</p>
        <div class="row full-width">
          <div class="col-md-7 col-sm-12 text-center modify">
            <div class="row__wrapper">
              <q-input class="text-left" v-model="model" float-label="Enter Token" placeholder="FlespiToken XXXXXXXXXXXXXXXXXXXXXX" />
            </div>
            <q-btn
              :class="[$q.platform.is.mobile ? 'full-width' : '']"
              color="dark"
              @click="logIn"
              icon-right="arrow_forward"
            >
              LogIn
            </q-btn>
          </div>
          <div class="col-md-5 col-sm-12 text-dark text-center" style="padding-top: 15px;">
            <div class="row__wrapper">
              <img src="../statics/flespi_logo_black.svg" alt="flespi" style="height: 30px; margin-bottom: 10px"><br>
              Don`t have a token?
            </div>
            <a href="https://flespi.io" target="_blank">
              <q-btn
                :class="[$q.platform.is.mobile ? 'full-width' : '']"
                color="dark"
              >Register</q-btn>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="offline" class="login-card shadow-4 bg-white">
      <div class="column items-center justify-center no-wrap text-grey-6 uppercase" style="font-size: 10vmax;">
        Offline
      </div>
      <q-progress indeterminate color="grey-6" style="width: 100%; height: 3px" />
      <div class="text-center text-grey-6 uppercase">
        waiting for reconnection
      </div>
    </div>
    <div v-else>
      <div class="login-card shadow-4 bg-white column items-center justify-center no-wrap">
        <q-progress indeterminate color="positive" style="width: 100%; height: 45px" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data () {
    return {
      token: '',
      offlineIntervalId: 0
    }
  },
  computed: {
    ...mapState(['offline']),
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
    ...mapActions(['checkConnection']),
    logIn () {
      this.$store.commit('setToken', this.token)
      this.$nextTick(() => { this.$router.push('/') })
    },
    autoLogin () {
      this.$store.commit('setToken', this.$route.params.token)
      setTimeout(() => {
        this.$router.push('/')
      }, 1000)
    },
    checkHasToken () {
      let authCookie = this.$q.cookies.get('X-Flespi-Token'),
        localStorageToken = this.$q.localStorage.get.item('X-Flespi-Token')
      if (this.$route.params && this.$route.params.token) {
        this.autoLogin()
      } else if (localStorageToken) {
        this.token = localStorageToken
        this.logIn()
      } else if (authCookie) {
        this.$q.dialog({
          title: 'Confirm',
          message: `Do you want log in by token ${authCookie}.`,
          ok: true,
          cancel: true
        }).then(() => {
          this.token = authCookie
          this.logIn()
        })
          .catch(() => {})
      }
    }
  },
  watch: {
    $route (val) {
      if (val.params && val.params.token) {
        this.autoLogin()
      }
    },
    offline (val) {
      if (val) {
        if (!this.offlineIntervalId) {
          this.offlineIntervalId = setInterval(this.checkConnection, 5000)
        }
      } else {
        clearInterval(this.offlineIntervalId)
        this.checkHasToken()
      }
    }
  },
  created () {
    if (!this.offline) {
      this.checkHasToken()
    } else {
      if (!this.offlineIntervalId) {
        this.offlineIntervalId = setInterval(this.checkConnection, 5000)
      }
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
      background-image url(../statics/mountain.svg)
      background-position center 100px
      background-size contain
      background-repeat no-repeat
      background-color #333
      color rgba(255,255,255,0.9)
      .login-code
        height 50vh
        width: 80vw;
        max-width: 600px;
        background-image url(../statics/trackit.png)
        background-position center
        background-size contain
        background-repeat no-repeat
        opacity .8
        padding-top 20vh
    .login-card
      border-radius 2px
      margin-top -50px
      width 80vw
      max-width 600px
      padding 25px
      > i
        font-size 5rem
  @media (min-width 767px) {
    .modify {
      border-right: 1px solid #ccc;
      padding-right: 30px;
    }
  }
</style>
