<template>
  <div class="q-v-date-range-picker" style="min-width: 180px">
    <q-btn :color="theme.bgColor" flat dense @click="prevHandler" icon="keyboard_arrow_left">
      <q-tooltip>Previous time range</q-tooltip>
    </q-btn>
    <q-btn @click="dateRangeToggle" flat :color="theme.bgColor" style="min-width: 124px; font-size: .8rem; line-height: .8rem;" class="q-pa-none">
      <div>
        <div>{{formatDate(dateModel[0])}}</div>
        <div style="font-size: .5rem">|</div>
        <div>{{formatDate(dateModel[1])}}</div>
      </div>
      <q-tooltip>Change time</q-tooltip>
    </q-btn>
    <q-btn :color="theme.bgColor" flat dense @click="nextHandler" icon="keyboard_arrow_right">
      <q-tooltip>Next time range</q-tooltip>
    </q-btn>
    <q-dialog ref="dateRangePickerModal" content-class="modal-date-range">
      <q-card>
        <q-card-section class="scroll q-pa-none" :class="{[`bg-${theme.bgColor}`]: true, 'text-white': !!theme.bgColor}">
          <div class="flex flex-center" style="max-width: 330px;">
            <div class="fit text-center q-my-sm">
              <q-btn-toggle v-model="mode" :options="dateRangeModeOptions" :color="theme.bgColor" text-color="grey" :toggle-text-color="theme.color" flat/>
            </div>
            <date-range-picker
              class="q-ma-sm"
              v-model="dateModel"
              :mode="mode"
              :theme="theme"
              @change:mode="changeModeDateTimeRangeHandler"
              @error="flag => saveDisabled = flag"
            />
          </div>
        </q-card-section>
        <q-card-actions align='between' :class="{[`bg-${theme.bgColor}`]: true, 'text-white': !!theme.bgColor}">
          <q-btn flat :color="theme.color" dense icon="mdi-map-clock-outline" @click="$emit('reinit'),dateRangeModalClose()">
            <q-tooltip>Reinit time by devices positions</q-tooltip>
          </q-btn>
          <div>
            <q-btn flat :color="theme.color" @click="dateRangeModalClose">close</q-btn>
            <q-btn flat :color="theme.color" @click="dateRangeModalSave" :disable="saveDisabled">save</q-btn>
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { date } from 'quasar'
import DateRangePicker from 'datetimerangepicker'
export default {
  props: ['theme', 'date'],
  data () {
    return {
      dateModel: this.date,
      mode: 0,
      saveDisabled: false,
      dateRangeModeOptions: [
        { label: 'Day', value: 0 },
        { label: 'Range', value: 3 },
        { label: 'Manual', value: 4 }
      ]
    }
  },
  methods: {
    dateRangeToggle () {
      this.$refs.dateRangePickerModal.toggle()
    },
    dateRangeModalClose () {
      this.$refs.dateRangePickerModal.hide()
    },
    changeModeDateTimeRangeHandler (mode) {
      this.mode = mode
    },
    dateRangeModalSave () {
      let [from, to] = this.dateModel
      to += 0.999
      this.$emit('save', [from ,to])
      this.dateRangeModalClose()
    },
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY HH:mm:ss')
    },
    prevHandler () {
      const delta = this.dateModel[1] - this.dateModel[0],
        newTo = this.dateModel[0] - 0.001,
        newFrom = newTo - delta
      this.dateModel = [newFrom, newTo]
      this.$emit('save', this.dateModel)
    },
    nextHandler () {
      const delta = this.dateModel[1] - this.dateModel[0],
        newFrom = this.dateModel[1] + 0.001,
        newTo = newFrom + delta
      this.dateModel = [newFrom, newTo]
      this.$emit('save', this.dateModel)
    }
  },
  watch: {
    date (date) {
      this.dateModel = date
    }
  },
  components: { DateRangePicker }
}
</script>

<style lang="stylus">
  .q-v-date-range-picker
    .q-btn__wrapper
      padding-left 0
      padding-right 0
  .modal-date-range
    .q-dialog__inner--minimized
      padding 6px
</style>
