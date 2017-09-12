<template>
  <q-modal @open="modalOpenHandler" ref="postMessageModal" :content-css="{minWidth: '50vw', minHeight: '50vh'}">
    <q-modal-layout>
      <q-toolbar slot="footer" color="dark">
        <q-btn class="full-width" flat @click="modalSubmit">Send</q-btn>
      </q-toolbar>
      <q-toolbar slot="header" color="dark">
        <span class="header__label">Send message</span>
        <q-icon name="close" class="absolute-top-right cursor-pointer" size="2.5rem" flat
                @click="modalButtonCloseHandler"></q-icon>
      </q-toolbar>
    <div class="modal__wrapper">
      <div class="row">
        <div class="col-md-6 col-sm-12">
          <q-input v-model="currentPos.lat" float-label="Latitude" placeholder="Latitude"/>
          <q-input v-model="currentPos.lng" float-label="Longitude" placeholder="Longitude"/>
        </div>
        <div class="text-center col-md-5 offset-md-1 col-sm-12">
          <q-knob v-model="direction" :min="0" :max="360">
            <div class="direction" :style="{transform: `rotate(${direction - 45}deg)`}"></div>
          </q-knob>
        </div>
        <div class="col-4">
          <q-input v-model="altitude" type="number" :min="-100" :max="10000" float-label="Altitude"
                   placeholder="Altitude"/>
        </div>
        <div class="col-4">
          <q-input v-model="satellites" type="number" :min="0" float-label="Satellites" placeholder="Satellites"/>
        </div>
        <div class="col-4">
          <q-input v-model="speed" type="number" :min="0" float-label="Speed" placeholder="Speed"/>
        </div>
        <div class="col-12">Custom properties</div>
        <div class="col-4">
          Key
        </div>
        <div class="col-8">
          Value
        </div>

        <div class="col-4">
          <q-input v-model="current_custom_field.key" type="text" placeholder="Key"/>
        </div>
        <div class="col-4 text-center vertical-middle" style="line-height: 3.5rem">
          <q-input v-if="type_current_field == 'number'" v-model="current_custom_field.value" type="number"
                   placeholder="Value"/>
          <q-input v-if="type_current_field == 'string'" v-model="current_custom_field.value" type="text"
                   placeholder="Value"/>
          <q-checkbox v-if="type_current_field == 'bool'" v-model="current_custom_field.value"/>
        </div>
        <div class="col-2">
          <q-select
            v-model="type_current_field"
            :options="types_current_field"
            @change="inputChange"
          />
        </div>
        <div class="col-2 relative-position">
          <q-icon name="add" class="pull-right cursor-pointer absolute-bottom-right" style="bottom: 10px" size="2rem"
                  flat @click="addCustomFieldHandler"></q-icon>
        </div>
      </div>
      <div v-for="(value, key) in custom" class="row" :key="key" style="margin-top: 10px">
        <div class="col-5 ellipsis">
          {{key}}
        </div>
        <div class="col-5 ellipsis">
          {{value}}
        </div>
        <div class="col-2">
          <q-icon name="remove" class="pull-right cursor-pointer" size="1.5rem" flat
                  @click="removeCustomFieldHandler(key)"></q-icon>
        </div>
      </div>
    </div>
    </q-modal-layout>
  </q-modal>
</template>

<script>
  import Vue from 'vue'
  import { QModal, QIcon, QBtn, QSelect, QInput, QKnob, QCheckbox, QModalLayout, QToolbar } from 'quasar-framework'

  export default {
    props: [
      'currentPos',
      'deviceID',
      'lastMessage'
    ],
    data () {
      return {
        type_current_field: 'string',
        types_current_field: [
          {
            label: 'String',
            value: 'string'
          },
          {
            label: 'Number',
            value: 'number'
          },
          {
            label: 'Boolean',
            value: 'bool'
          }
        ],
        current_custom_field: {
          key: null,
          value: null
        },
        altitude: 0,
        speed: 0,
        satellites: 0,
        direction: 0,
        custom: {}
      }
    },
    methods: {
      open () {
        this.$refs.postMessageModal.open()
      },
      modalOpenHandler () {
        this.direction = this.lastMessage && this.lastMessage['position.direction'] ? this.lastMessage['position.direction'] : 0
        let latlonOfLastMessage = Object.keys(this.lastMessage).length ? [this.lastMessage['position.latitude'], this.lastMessage['position.longitude']] : [51.50853, -0.12574]
        this.$emit('update:marker', {id: this.deviceID, lastPos: latlonOfLastMessage})
      },
      modalSubmit () {
        let data = Object.assign({
          'position.latitude': this.currentPos.lat,
          'position.longitude': this.currentPos.lng,
          'position.altitude': this.altitude,
          'position.direction': this.direction,
          'position.satellites': this.satellites,
          'position.speed': this.speed
        }, this.custom)
        this.$store.dispatch('postMessage', {data, id: this.deviceID})
        this.$emit('update:dragged', false)
        this.altitude = 0
        this.satellites = 0
        this.speed = 0
        this.custom = {}
        this.type_current_field = 'string'
        this.current_custom_field = {
          key: null,
          value: null
        }
        this.$refs.postMessageModal.close()
      },
      modalButtonCloseHandler () {
        this.$emit('update:dragged', false)
        this.$refs.postMessageModal.close()
      },
      addCustomFieldHandler () {
        if (this.current_custom_field.key) {
          Vue.set(this.custom, this.current_custom_field.key, this.current_custom_field.value)
          this.current_custom_field.key = null
          this.current_custom_field.value = null
          this.type_current_field = 'string'
        }
      },
      removeCustomFieldHandler (fieldName) {
        Vue.delete(this.custom, fieldName)
      },
      inputChange (val) {
        switch (val) {
          case 'number': {
            this.current_custom_field.value = 0
            break
          }
          case 'string': {
            this.current_custom_field.value = ''
            break
          }
          case 'bool': {
            this.current_custom_field.value = false
            break
          }
        }
      }
    },
    components: { QModal, QIcon, QBtn, QSelect, QInput, QKnob, QCheckbox, QModalLayout, QToolbar }
  }
</script>

<style lang="stylus">
  .modal__wrapper {
    padding 20px
    .modal__header {
      margin-bottom: 20px;
      .header__label {
        font-size 1.5rem
      }
    }
  }
</style>
