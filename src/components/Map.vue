<template>
  <div class="map-wrapper absolute-top-left absolute-bottom-right">
    <div id="map">
      <q-resize-observable @resize="onResize" />
    </div>
    <queue
      :devices="activeDevices"
      :activeDevicesID="activeDevicesID"
      :needShowMessages="params.needShowMessages"
      :messages="messages"
      :isAdmin="admin.flag"
      @send="prepareForSendMessage"
      v-if="Object.keys(messages).length && params.needShowMessages">
    </queue>
    <post-message-modal
      ref="postMessageModal"
      :currentPos="draggedMarker.markerCurrentPosition"
      :deviceID="draggedMarker.markerID"
      :lastMessage="lastMessage"
      @update:marker="updateMarkerHandler"
      @update:dragged="updateFlagHandler"
    />
  </div>
</template>

<script>
  import L from 'leaflet'
  import Vue from 'vue'
  import Queue from './Queue.vue'
  import PostMessageModal from './PostMessageModal.vue'
  import { QResizeObservable, Toast } from 'quasar-framework'
  import { createNamespacedHelpers } from 'vuex'

  let { mapState, mapActions, mapMutations } = createNamespacedHelpers('messages')

  export default {
    name: 'Map',
    props: [
      'params',
      'deviceIdForWatch',
      'activeDevices',
      'delay'
    ],
    data () {
      return {
        isDragged: false,
        map: null,
        currentDelay: this.delay || 2000,
        intervalId: 0,
        markers: {},
        tracks: {},
        lastMessage: {},
        draggedMarker: {
          markerCurrentPosition: [],
          markerID: 0
        },
        openModalFlag: false,
        colors: [
          '#21ba45',
          '#26a59b',
          '#037be3',
          '#565456',
          '#f1c037',
          '#db2929',
          '#777777',
          '#663bb5'
        ],
        currentColor: 0,
        admin: {
          flag: false,
          counter: 0,
          timerId: 0
        }
      }
    },
    computed: {
      ...mapState({
        messages: state => state.entities,
        activeDevicesID: state => state.activeDevicesID
      })
    },
    methods: {
      ...mapMutations([
        'setActiveDevicesID',
        'clearByID',
        'clear'
      ]),
      ...mapActions([
        'get',
        'getHistoryByDeviceID'
      ]),
      initMap () {
        if (!this.map) {
          this.map = L.map('map', {
            center: [51.50853, -0.12574],
            zoom: 3
          })
          this.map.addEventListener('click', e => {
            if (L.DomUtil.hasClass(this.map._container, 'crosshair-cursor-enabled')) {
              this.draggedMarker.markerCurrentPosition = e.latlng
              L.DomUtil.removeClass(this.map._container, 'crosshair-cursor-enabled')
              this.$refs.postMessageModal.open()
              this.$emit('update:send-active', null)
            }
            // admin logic
            this.admin.counter += 1
            this.admin.timerId = setTimeout(() => {
              if (this.admin.timerId && this.admin.counter >= 10) {
                this.admin.flag = !this.admin.flag
              }
              this.admin.timerId = 0
              this.admin.counter = 0
            }, 2000)
          })
          L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(this.map)
        }
      },
      generateIcon (id, name) {
        return L.divIcon({
          className: `my-div-icon icon-${id}`,
          iconSize: new L.Point(20, 20),
          html: `<div class="my-div-icon__inner"></div><div class="my-div-icon__name">${name}</div>`
        })
      },
      initMarker (id, name, position) {
        let direction = this.messages[id][0]['position.direction'] ? this.messages[id][0]['position.direction'] : 0
        this.markers[id] = L.marker(position, {
          icon: this.generateIcon(id, name),
          draggable: this.admin.flag,
          title: name
        })
        this.markers[id].id = id
        this.markers[id].addEventListener('dragstart', (e) => {
          this.isDragged = true
        })
        this.markers[id].addEventListener('dragend', e => {
          this.draggedMarker.markerCurrentPosition = e.target.getLatLng()
          this.draggedMarker.markerID = e.target.id
          this.lastMessage = this.messages[e.target.id][0] ? this.messages[e.target.id][0] : {}
          this.$refs.postMessageModal.open()
        })
        this.markers[id].addEventListener('add', e => {
          document.querySelector(`.icon-${id} .my-div-icon__inner`).style.transform = `rotate(${direction - 45}deg)`
          if (this.messages[id] && this.messages[id].length && this.deviceIdForWatch === parseInt(id)) {
            document.querySelector(`.icon-${id} .my-div-icon__inner`).style.borderColor = 'red'
          }
        })
        this.markers[id].addEventListener('click', e => {
          this.$emit('update:telemetry-device-id', parseInt(id))
        })
        this.markers[id].addEventListener('move', e => {
          document.querySelector(`.icon-${id} .my-div-icon__inner`).style.transform = `rotate(${(this.messages[id][0]['position.direction'] ? this.messages[id][0]['position.direction'] : 0) - 45}deg)`
        })
        this.markers[id].addTo(this.map)
      },
      initDeviceOnMap (id) {
        let currentDevice = this.activeDevices.filter(device => device.id === parseInt(id))[0]
        if (!currentDevice.telemetry) {
          this.markers[id] = {}
          this.markers[id].id = id
          this.tracks[id] = {}
          return false
        }
        let position = [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']],
          name = currentDevice.name || `#${id}`
        this.initMarker(id, name, position)
        this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), {color: this.colors[this.colors[this.currentColor] ? this.currentColor++ : this.currentColor = 0]}).addTo(this.map)
      },
      updateDeviceOnMap (id) {
        let currentArrPos = this.getLatLngArrByDevice(id)
        if (this.deviceIdForWatch && this.messages[this.deviceIdForWatch] && this.messages[this.deviceIdForWatch].length) {
          this.map.flyTo(this.getLatLngArrByDevice(this.deviceIdForWatch)[0], 15)
        }
        if (this.messages[id].length) {
          if (!(this.markers[id] instanceof L.Marker)) {
            let name = this.activeDevices.filter(device => device.id === parseInt(id))[0].name || `#${id}`,
              position = [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']]
            this.initMarker(id, name, position)
          }
          if (!(this.tracks[id] instanceof L.Polyline)) {
            this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), {color: this.colors[this.colors[this.currentColor] ? this.currentColor++ : this.currentColor = 0]}).addTo(this.map)
          }
        }
        if (!this.isDragged) {
          this.markers[id].setLatLng(currentArrPos[0]).update()
        }
        this.markers[id].setOpacity(1)
        this.tracks[id].setLatLngs(currentArrPos)
      },
      getLatLngArrByDevice (id) {
        if (!this.messages[id]) {
          return []
        }
        return this.messages[id].reduce((acc, message) => {
          acc.push([message['position.latitude'], message['position.longitude']])
          return acc
        }, [])
      },
      prepareForSendMessage (id) {
        this.draggedMarker.markerID = parseInt(id)
        this.lastMessage = this.messages[id] && this.messages[id][0] ? this.messages[id][0] : {}
        L.DomUtil.addClass(this.map._container, 'crosshair-cursor-enabled')
      },
      onResize () {
        if (this.map) {
          this.map.invalidateSize()
        }
      },
      updateMarkerHandler ({ id, lastPos }) {
        if (this.markers[id]) {
          this.markers[id].setLatLng(lastPos).update()
        }
      },
      updateFlagHandler (value) {
        this.isDragged = value
      },
      removeMarker (id) {
        if (this.markers[id] && this.markers[id] instanceof L.Marker) {
          this.markers[id].remove()
          this.tracks[id].remove()
        }
        Vue.delete(this.markers, id)
        Vue.delete(this.tracks, id)
      },
      flyToDevice (id) {
        let devicesById = this.activeDevices.filter(device => device.id === id),
          currentDevice = devicesById.length ? devicesById[0] : null,
          currentPos = currentDevice && currentDevice.telemetry ? [currentDevice.telemetry['position.latitude'].value, currentDevice.telemetry['position.longitude'].value] : []
        if (currentPos.length) {
          this.map.flyTo(currentPos, 15)
        }
        else {
          Toast.create('No Position!')
        }
      }
    },
    watch: {
      messages: {
        deep: true,
        handler (messages) {
          let keyArr = Object.keys(messages),
            oldKeyArr = Object.keys(this.markers)
          if (!keyArr.length) {
            Object.keys(this.markers).forEach(id => {
              this.removeMarker(id)
            })
            return false
          }
          if (keyArr.length < oldKeyArr.length) {
            let removeDeviceId = oldKeyArr.filter(key => !keyArr.includes(key))[0]
            this.removeMarker(removeDeviceId)
            return false
          }
          keyArr.forEach(id => {
            if (!messages[id].length) {
              if (!this.activeDevices.filter(device => device.id === parseInt(id))[0].telemetry && !this.markers[id]) {
                this.initDeviceOnMap(id)
              }
              return false
            }
            if (oldKeyArr.includes(id)) {
              this.updateDeviceOnMap(id)
            }
            else {
              this.initDeviceOnMap(id)
            }
          })
        }
      },
      activeDevices (newVal) {
        let currentDevicesID = Object.keys(this.messages).map(id => parseInt(id)),
          activeDevicesId = newVal.map(device => device.id),
          modifyType = currentDevicesID.length > newVal.length ? 'remove' : 'add'

        this.setActiveDevicesID(activeDevicesId)
        switch (modifyType) {
          case 'remove': {
            let removedDevicesID = currentDevicesID.filter(id => !activeDevicesId.includes(id))
            if (removedDevicesID.length === 1 && removedDevicesID[0]) {
              this.clearByID(removedDevicesID[0])
            }
            else if (removedDevicesID.length === currentDevicesID.length) {
              this.clear()
            }
            break
          }
          case 'add': {
            let addedDeviceID = activeDevicesId.filter(id => !currentDevicesID.includes(id))[0]
            if (addedDeviceID) {
              this.getHistoryByDeviceID(addedDeviceID)
            }
            break
          }
        }
        if (L.DomUtil.hasClass(this.map._container, 'crosshair-cursor-enabled')) {
          L.DomUtil.removeClass(this.map._container, 'crosshair-cursor-enabled')
        }
      },
      deviceIdForWatch (id) {
        if (id) {
          this.flyToDevice(id)
          document.querySelectorAll('.my-div-icon__inner').forEach(elem => {
            elem.style.borderColor = ''
          })
          if (this.messages[id] && this.messages[id].length) {
            document.querySelector(`.my-div-icon.icon-${id} .my-div-icon__inner`).style.borderColor = 'red'
          }
        }
        else {
          document.querySelectorAll('.my-div-icon__inner').forEach(elem => {
            elem.style.borderColor = ''
          })
        }
      },
      'admin.flag': function (flag) {
        if (flag) {
          Object.keys(this.markers).forEach(id => {
            this.markers[id].dragging.enable()
          })
          Toast.create('Send messages: enabled')
        }
        else {
          Object.keys(this.markers).forEach(id => {
            this.markers[id].dragging.disable()
          })
          Toast.create('Send messages: disabled')
        }
      }
    },
    created () {
      this.setActiveDevicesID(this.activeDevices.map(device => device.id))
      this.intervalId = setInterval(this.get, this.currentDelay)
    },
    mounted () {
      this.initMap()
    },
    beforeDestroy () {
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
      this.clear()
    },
    components: { Queue, PostMessageModal, QResizeObservable }
  }
</script>

<style lang="stylus">
  @import "~leaflet/dist/leaflet.css";
  #map {
    height: 100%;
  }
  .leaflet-container.crosshair-cursor-enabled {
    cursor:crosshair;
  }
  .my-div-icon__inner {
    border: 2px solid rgba(0, 0, 0, .5);
    border-radius: 50% 0 50% 50%;
    background-color: rgba(255, 255, 255, .5);
    height:100%
  }
  .my-div-icon__name {
    line-height: 20px;
    font-size: 1.05rem;
    position: absolute;
    top: 0;
    left: 30px;
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .direction {
    border: 2px solid black;
    border-radius: 50% 0 50% 50%;
    background-color: white;
    opacity: .5;
    height: 20px
    width 20px
  }
</style>
