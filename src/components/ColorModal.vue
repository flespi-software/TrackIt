<template>
  <q-dialog minimized ref="colorModal" class="color-modal" :content-css="{minWidth: '240px', minHeight: '201px'}">
    <div class="bg-grey-9">
      <q-color dark v-model="color" format-model="hex"/>
      <q-btn @click="modalSubmit(color)" class="full-width" flat color="white">Set</q-btn>
    </div>
  </q-dialog>
</template>

<script>
export default {
  name: 'ColorModal',
  props: ['value'],
  data () {
    return {
      color: this.value || '#fff'
    }
  },
  methods: {
    modalSubmit (color) {
      this.$emit('input', color)
      this.currentColorId = 0
      this.color = '#fff'
      this.$refs.colorModal.hide()
      this.$emit('hide')
    },
    modalButtonCloseHandler () {
      this.color = '#fff'
      this.$refs.colorModal.hide()
      this.$emit('hide')
    },
    show () {
      this.$refs.colorModal.show()
    }
  },
  watch: {
    value (color) {
      this.color = color
    }
  }
}
</script>

<style scoped>

</style>
