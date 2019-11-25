<template>
  <q-dialog minimized ref="colorModal" class="color-modal" :content-css="{minWidth: '240px', minHeight: '201px'}">
    <div slot="header" style="background-color: #444; height: 20px">
      <q-icon color="white" name="close" class="absolute-top-right cursor-pointer" size="1rem" flat @click.native="modalButtonCloseHandler" />
    </div>
    <q-color dark :value="color" @change="modalSubmit" format-model="hex"/>
  </q-dialog>
</template>

<script>
export default {
  name: 'ColorModal',
  props: ['value'],
  data () {
    return {
      color: '#fff'
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
  }
}
</script>

<style scoped>

</style>
