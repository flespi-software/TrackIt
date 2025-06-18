<template>
  <q-item v-if="deviceId" style="border-top: 1px solid #ddd; min-height: 71px">
    <div
      class="text-center absolute-top-left bg-grey-4 text-bold text-grey-9"
      style="font-size: 10px; min-width: 55px; padding: 0 3px; z-index: 1; border-radius: 0 0 3px 0"
    >
      #{{ deviceId }}
    </div>
    <q-item-section side :class="{ 'text-grey-4': inverted }">
      <q-icon size="1.7rem" name="mdi-developer-board" />
    </q-item-section>
    <q-item-section>
      <q-item-label header class="ellipsis q-pa-none" :class="{ 'text-grey-4': inverted }"
        >{{ device.name || '&lt;noname&gt;' }}
        <q-tooltip>{{ device.name || '&lt;noname&gt;' }}</q-tooltip>
      </q-item-label>
      <q-item-label caption class="ellipsis" :class="{ 'text-grey-4': inverted }">
        <q-icon name="mdi-label-outline" />
        {{
          device.configuration && device.configuration.ident
            ? device.configuration.ident
            : '&lt;no ident&gt;'
        }}
      </q-item-label>
      <q-item-label
        caption
        v-if="device.configuration && device.configuration.phone"
        :class="{ 'text-grey-4': inverted }"
      >
        <q-icon name="mdi-phone" />
        {{
          device.configuration && device.configuration.phone
            ? device.configuration.phone
            : '&lt;no phone&gt;'
        }}
      </q-item-label>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-input
        dense
        outlined
        hide-bottom-space
        autocapitalize="none"
        type="text"
        label="Search"
        v-model="filter"
        :dark="inverted"
        :color="inverted ? 'white' : 'grey'"
        class="q-mb-xs"
        @update:model-value="setFilteredTelemetry"
      />
    </q-item-section>
  </q-item>
  <q-list
    separator
    no-border
    class="no-padding scroll scrollable"
    style="min-height: 30vh; height: calc(100% - 128px)"
  >
    <q-item v-if="isLoading === false && telemetryKeys.length === 0" :class="[cls.bg]">
      <q-item-section>
        <q-item-label class="ellipsis text-bold text-center" :class="[cls.text]"
          >Telemetry is empty</q-item-label
        >
        <q-item-label class="ellipsis text-center" :class="[cls.text]"
          >or no access to telemetry provided</q-item-label
        >
      </q-item-section>
    </q-item>
    <q-item
      v-if="isLoading === false && filteredTelemetryKeys.length === 0 && this.filter"
      :class="[cls.bg]"
    >
      <q-item-section>
        <q-item-label class="ellipsis text-center" :class="[cls.text]"
          >Nothing found on your search</q-item-label
        >
      </q-item-section>
    </q-item>
    <div
      v-if="isLoading === true || showSpinner === true"
      style="text-align: center; margin-top: 10%"
    >
      <q-spinner-gears size="70px" color="white" />
    </div>
    <q-virtual-scroll
      v-if="filteredTelemetryKeys.length"
      :items="filteredTelemetryKeys"
      virtual-scroll-item-size="55"
      virtual-scroll-slice-ratio-after="2"
      virtual-scroll-slice-ratio-before="2"
    >
      <template v-slot="{ item }">
        <q-item
          style="transition: all 0.5s ease-in-out"
          :class="[
            !prevTelemetry[item] || prevTelemetry[item].value !== telemetry[item].value
              ? cls.highlight
              : cls.bg,
          ]"
        >
          <q-item-section>
            <q-item-label class="ellipsis text-bold" :class="[cls.text]">
              {{ item }}
              <q-tooltip>{{ item }}</q-tooltip>
            </q-item-label>
            <q-item-label class="ellipsis" :class="[cls.text]">
              <q-icon
                name="mdi-content-copy"
                style="padding-right: 1px; cursor: pointer"
                @click.stop="copyValueHandler(telemetry[item].value)"
              >
                <q-tooltip>copy</q-tooltip>
              </q-icon>
              <span>
                {{ telemetry[item].value }}
                <q-tooltip>{{ telemetry[item].value }}</q-tooltip>
              </span>
            </q-item-label>
          </q-item-section>
          <q-item-section side right
            ><div :class="[cls.text]" class="text-caption text-italic">
              {{ fromNow(telemetry[item].ts * 1000) }}
            </div>
            <q-tooltip>{{ formatTimestampToDate(telemetry[item].ts) }}</q-tooltip>
          </q-item-section>
          <q-menu class="shadow-1" ref="popovers">
            <q-list v-if="history[item] && history[item].length" separator no-border>
              <q-item>
                <q-item-section avatar>
                  <q-icon size="1.5rem" name="history" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="ellipsis">History</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-for="(obj, index) in history[item]" :key="index">
                <q-item-section>
                  <q-item-label class="ellipsis">{{ obj.value }}</q-item-label>
                </q-item-section>
                <q-item-section side class="text-caption">{{
                  formatTimestampToDate(obj.ts)
                }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-item>
      </template>
    </q-virtual-scroll>
  </q-list>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { debounce, copyToClipboard } from 'quasar'
import { useDevicesStore } from 'src/stores/devices'
import { useTelemetryStore } from 'src/stores/telemetry'
import { useMiscStore } from 'src/stores/misc'

export default defineComponent({
  name: 'DeviceTelemetry',
  emits: ['diff'],
  props: {
    deviceId: {
      type: Number,
      default: 0,
    },
    inverted: Boolean,
  },
  data() {
    return {
      filter: '',
      filteredTelemetry: {},
      history: {},
      prevTelemetry: {},
      prevTelemetryTimeout: 0,
      showSpinner: false,
    }
  },
  computed: {
    ...mapState(useTelemetryStore, {
      isLoading: (store) => store.isLoading,
      telemetry: (store) => store.telemetry,
      telemetryKeys: (store) => store.telemetryKeys,
    }),
    cls() {
      return this.inverted
        ? {
            text: `text-white`,
            bg: 'bg-grey-9',
            highlight: 'bg-grey-7',
          }
        : {
            text: `text-black`,
            bg: '',
            highlight: 'bg-grey-3',
          }
    },
    device() {
      const device = useDevicesStore().getDeviceById(this.deviceId)
      return device === null ? {} : device
    },
    filteredTelemetryKeys() {
      return Object.keys(this.filteredTelemetry)
    },
  },
  methods: {
    ...mapActions(useMiscStore, ['formatTimestampToDate', 'fromNow']),
    copyValueHandler(value) {
      copyToClipboard(value).then(
        (e) => {
          this.$q.notify({
            color: 'positive',
            icon: 'content_copy',
            message: `Value copied`,
            timeout: 1000,
            position: 'bottom-right',
          })
        },
        (e) => {
          this.$q.notify({
            color: 'negative',
            icon: 'content_copy',
            message: `Error coping value`,
            timeout: 1000,
            position: 'bottom-right',
          })
        },
      )
    },
    getDiff() {
      return Object.keys(this.telemetry).reduce((acc, key) => {
        if (
          !this.prevTelemetry[key] ||
          this.prevTelemetry[key].value !== this.telemetry[key].value
        ) {
          acc[key] = this.telemetry[key]
        }
        return acc
      }, {})
    },
    makeHistory(newTelemetry) {
      Object.keys(newTelemetry).forEach((key) => {
        if (!this.history[key]) {
          this.history[key] = [newTelemetry[key]]
        }
        if (this.history[key].length) {
          if (this.history[key][0].value !== newTelemetry[key].value) {
            this.history[key].unshift(newTelemetry[key])
            if (this.history[key].length > 10) {
              this.history[key].pop()
            }
          }
        }
      })
    },
    setFilteredTelemetry() {
      /* this method is called whenever changes filter or telemetry */
      if (this.filter.length === 0) {
        /* no filtering needed, just use all telemetry */
        this.filteredTelemetry = { ...this.telemetry }
        return
      }
      if (this.filter.length < 3) {
        /* do not apply such short filters */
        return
      }
      let filteredTelemetry = { ...this.telemetry }
      const lowerCaseFilter = this.filter.toLowerCase()
      this.telemetryKeys.forEach((key) => {
        if (key.indexOf(lowerCaseFilter) !== -1) {
          filteredTelemetry[key] = this.telemetry[key]
        } else if (filteredTelemetry[key]) {
          delete filteredTelemetry[key]
        }
      })
      this.filteredTelemetry = filteredTelemetry
    },
    telemetryDiffHistoryProcessing(telemetry) {
      const diff = this.getDiff()
      Object.keys(diff).length
        ? this.$emit('diff', diff)
        : this.$emit('diff', {
            ...telemetry,
          })
      if (this.prevTelemetryTimeout) {
        clearTimeout(this.prevTelemetryTimeout)
      }
      this.prevTelemetryTimeout = setTimeout(() => {
        this.prevTelemetry = {
          ...telemetry,
        }
        this.makeHistory(telemetry)
        this.prevTelemetryTimeout = 0
      }, 1000)
    },
    telemetryProcessing(telemetry) {
      this.setFilteredTelemetry()
      this.telemetryDiffHistoryProcessing(telemetry)
    },
  },
  watch: {
    deviceId() {
      /* device for telemetry has changed */
      this.filteredTelemetry = {}
      this.history = {}
      clearTimeout(this.prevTelemetryTimeout)
      this.prevTelemetry = {}
    },
    telemetry: {
      deep: true,
      handler(telemetry) {
        if (this.filteredTelemetryKeys.length === 0) {
          this.filteredTelemetry = { ...this.telemetry }
        }
        this.debouncedTelemetryProcessing(telemetry)
      },
    },
  },
  created() {
    this.debouncedTelemetryProcessing = debounce(this.telemetryProcessing, 3000)
    if (
      this.telemetryKeys.length > 0 &&
      this.filteredTelemetryKeys.length === 0 &&
      this.telemetryKeys.length > 0
    ) {
      /* force update of telemetry list for the cases when user closes and reopens right drawer, but subscription remains */
      this.showSpinner = true
      setTimeout(() => {
        this.setFilteredTelemetry()
        this.showSpinner = false
      }, 500)
    }
  },
})
</script>

<style lang="sass"></style>
