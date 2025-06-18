<template>
  <q-dialog minimized ref="colorModal" :content-css="{ minWidth: '240px', minHeight: '201px' }">
    <div class="bg-grey-9">
      <q-color dark no-header-tabs no-footer v-model="modalColor" format-model="hex" />
      <q-btn flat class="full-width" color="white" @click="modalSubmit"> Set </q-btn>
    </div>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ColorModal',
  emits: ['update:modelValue'],
  props: ['modelValue'],
  data() {
    return {
      selectedColor: '', // variable to store selected color until user hits Submit button
    }
  },
  computed: {
    modalColor: {
      get() {
        return this.modelValue || '#fff'
      },
      set(value) {
        /* remember currently selected color */
        this.selectedColor = value
      },
    },
  },
  methods: {
    modalSubmit() {
      /* user as finished color selection - notify parent about new selected color */
      this.$emit('update:modelValue', this.selectedColor)
      /* and close modal dialog */
      this.$refs.colorModal.hide()
    },
    show() {
      /* method is used by ActiveDevice and MapContainer components to display color modal dialog */
      this.$refs.colorModal.show()
    },
  },
})
</script>

<style lang="sass" scoped>
.q-color-picker
  width: 250px
</style>
