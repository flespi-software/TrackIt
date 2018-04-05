<template>
  <div id="q-app">
    <router-view />
    <offline logo="../statics/trackit.png"/>
  </div>
</template>

<script>
import Offline from './components/Offline'
export default {
  name: 'App',
  components: { Offline }
}
</script>

<style>
</style>
