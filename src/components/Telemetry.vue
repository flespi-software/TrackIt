<template>
  <q-list separator no-border>
    <q-item>
      <q-item-side left><q-icon color="white" size="1.8rem" name="developer_board"/></q-item-side>
      <q-item-main>
        <q-item-tile label class="ellipsis text-bold text-white">Telemetry</q-item-tile>
        <q-item-tile sublabel class="ellipsis text-white"><small>{{device.name || `#${device.id}`}}</small></q-item-tile>
      </q-item-main>
      <q-item-side right><q-icon color="white" class="pull-right cursor-pointer" name="arrow_forward" @click="closeHandler" size="1.8rem"></q-icon></q-item-side>
    </q-item>
    <q-item v-for="key in Object.keys(telemetry)" :key="key" style="transition: all .5s ease-in-out" :class="[!prevTelemetry[key] || prevTelemetry[key].value !== telemetry[key].value ? 'bg-grey-9' : 'bg-dark', 'bg-dark']">
      <q-item-main>
        <q-item-tile label class="ellipsis text-white">{{key}}<q-tooltip>{{key}}</q-tooltip></q-item-tile>
        <q-item-tile sublabel class="ellipsis text-white">{{telemetry[key].value}}<q-tooltip>{{telemetry[key].value}}</q-tooltip></q-item-tile>
      </q-item-main>
      <q-item-side right><small class="text-white">{{fromNow(telemetry[key].ts * 1000)}}</small><q-tooltip><small>{{getTime(telemetry[key].ts * 1000)}}</small></q-tooltip></q-item-side>
    </q-item>
  </q-list>
</template>

<script>
  import { QList, QListHeader, QItem, QItemMain, QItemSide, QItemTile, QTooltip, QIcon } from 'quasar-framework'
  import { createNamespacedHelpers } from 'vuex'
  import moment from 'moment'

  let { mapState, mapActions, mapMutations } = createNamespacedHelpers('telemetry')

  export default {
    props: [
      'device',
      'layout',
      'delay'
    ],
    data () {
      return {
        currentDelay: this.delay || 2000,
        intervalId: 0,
        prevTelemetry: {...this.device.telemetry}
      }
    },
    computed: {
      ...mapState([
        'deviceId',
        'telemetry'
      ])
    },
    methods: {
      ...mapMutations(['init', 'clear']),
      ...mapActions(['update']),
      closeHandler () {
        this.layout.hideRight()
      },
      fromNow (ts) {
        return moment(ts).fromNow()
      },
      getTime (ts) {
        return moment(ts).format('L HH:mm:ss')
      }
    },
    components: { QList, QListHeader, QItem, QItemMain, QItemSide, QItemTile, QTooltip, QIcon },
    watch: {
      device (device) {
        if (device.id && device.id !== this.deviceId) {
          this.init(device)
        }
      },
      telemetry: {
        deep: true,
        handler (telemetry) {
          setTimeout(() => { this.prevTelemetry = {...telemetry} }, 1000)
        }
      }
    },
    created () {
      this.init(this.device)
      this.update()
      this.intervalId = setInterval(this.update, this.currentDelay)
    },
    beforeDestroy () {
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
      this.clear()
    }
  }
</script>

<style>
</style>
