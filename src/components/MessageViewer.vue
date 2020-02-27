<template>
  <q-dialog @hide="$emit('close')" ref="modal">
    <q-card :style="{minWidth: $q.platform.is.mobile ? '100%' : '30vw'}" :class="{'bg-grey-9': inverted !== undefined}">
      <q-card-section :style="{height: $q.platform.is.mobile ? 'calc(100% - 52px)' : ''}" class="scroll q-pa-none">
        <div class="layout-padding q-pa-md">
          <div class="row items-center" v-for="(value, name, index) in message" :key="index">
            <div class="text-weight-bold">
              <span class="message-viewer__copy text-green cursor-pointer"><q-icon name="mdi-content-copy" @click.native="copy(`${name}: ${value}`)"/></span>
              <span class="message-viewer__name text-white">{{ name }}: </span>
              <span class="message-viewer__value text-green">{{ getValue(name, value) }}</span>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator color="white"/>
      <q-card-actions align="right" class="bg-grey-9 text-white">
        <q-btn flat @click="copy(message)">Copy full message</q-btn>
        <q-btn flat @click="$refs.modal.hide()">Close</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { date, copyToClipboard } from 'quasar'
export default {
  name: 'MessageViewer',
  data () {
    return {
      date: date
    }
  },
  props: {
    message: {
      type: Object,
      required: true
    },
    inverted: {
      type: Boolean
    }
  },
  methods: {
    show () {
      this.$refs.modal.show()
    },
    getValue (name, value) {
      if (name === 'timestamp') {
        return date.formatDate(value * 1000, 'DD/MM/YYYY HH:mm:ss')
      }
      return value
    },
    copy (value) {
      copyToClipboard(JSON.stringify(value)).then((e) => {
        this.$q.notify({
          color: 'positive',
          icon: 'content_copy',
          message: 'Successfully copied',
          timeout: 1000
        })
      }, (e) => {
        this.$q.notify({
          color: 'negative',
          icon: 'content_copy',
          message: 'Error coping',
          timeout: 1000
        })
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
