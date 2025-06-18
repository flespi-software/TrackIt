<template>
  <q-dialog @hide="$emit('close')" ref="modal">
    <q-card
      :style="{ minWidth: $q.platform.is.mobile ? '100%' : '30vw' }"
      :class="{ 'bg-grey-9': inverted !== undefined }"
    >
      <q-card-section
        :style="{ height: $q.platform.is.mobile ? 'calc(100% - 52px)' : '' }"
        class="scroll q-pa-none"
      >
        <div class="layout-padding q-pa-md">
          <div class="row items-center" v-for="(value, name, index) in message" :key="index">
            <div class="text-weight-bold">
              <span class="message-viewer__copy text-green cursor-pointer">
                <q-icon name="mdi-content-copy" @click="copy(`${name}: ${value}`)" />
              </span>
              <span class="message-viewer__name text-white">{{ name }}: </span>
              <span class="message-viewer__value text-green">{{ getValue(name, value) }}</span>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-separator color="white" />
      <q-card-actions align="right" class="bg-grey-9 text-white">
        <q-btn flat @click="copy(message)">Copy full message</q-btn>
        <q-btn flat @click="$refs.modal.hide()">Close</q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions } from 'pinia'
import { copyToClipboard } from 'quasar'
import { useMiscStore } from 'src/stores/misc'

export default defineComponent({
  name: 'MessageViewer',
  emits: ['close'],
  props: {
    message: {
      type: Object,
      required: true,
    },
    inverted: {
      type: Boolean,
    },
  },
  data() {
    return {}
  },
  methods: {
    ...mapActions(useMiscStore, ['formatTimestampToDate']),
    copy(value) {
      copyToClipboard(JSON.stringify(value)).then(
        (e) => {
          this.$q.notify({
            color: 'positive',
            icon: 'mdi-content-copy',
            message: 'Successfully copied',
            timeout: 1000,
          })
        },
        (e) => {
          this.$q.notify({
            color: 'negative',
            icon: 'mdi-content-copy',
            message: 'Error coping',
            timeout: 1000,
          })
        },
      )
    },
    getValue(name, value) {
      return name === 'timestamp' ? this.formatTimestampToDate(value) : value
    },
    show() {
      this.$refs.modal.show()
    },
  },
})
</script>

<style lang="sass"></style>
