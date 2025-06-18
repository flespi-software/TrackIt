<template>
  <router-view />
  <offline logo="trackit.png" />
</template>

<script>
import Offline from './components/Offline.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
  components: {
    Offline,
  },
})
</script>
