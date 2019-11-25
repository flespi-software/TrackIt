<template>
  <q-dialog @hide="$emit('close')" ref="modal" :content-css="{maxWidth: '100vw', maxHeight: '100vh', width: $q.platform.is.mobile ? '100vw' : '500px', height: $q.platform.is.mobile ? '100vh' : '400px'}" :content-classes="{'bg-grey-9': inverted !== undefined}">
    <q-toolbar slot="footer" color="grey-9"  style="justify-content: flex-end;">
      <q-btn flat @click="copy(message)">Copy full message</q-btn>
      <q-btn flat @click="$refs.modal.hide()">Close</q-btn>
    </q-toolbar>
    <div class="layout-padding">
      <div class="row items-center" v-for="(value, name, index) in message" :key="index">
        <div class="text-weight-bold">
          <span class="message-viewer__copy text-green cursor-pointer"><q-icon name="mdi-content-copy" @click.native="copy(`${name}: ${value}`)"/></span>
          <span class="message-viewer__name text-white">{{ name }}: </span>
          <span class="message-viewer__value text-green">{{ getValue(name, value) }}</span>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script>
import { date } from 'quasar'
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
      this.$copyText(JSON.stringify(value)).then((e) => {
        this.$q.notify({
          color: 'positive',
          icon: 'content_copy',
          message: `Successfully copied`,
          timeout: 1000
        })
      }, (e) => {
        this.$q.notify({
          color: 'negative',
          icon: 'content_copy',
          message: `Error coping`,
          timeout: 1000
        })
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
