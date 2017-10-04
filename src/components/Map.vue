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
      :telemetryDeviceId="telemetryDeviceId"
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
        flyToZoom: 15,
        currentDelay: this.delay || 2000,
        intervalId: 0,
        markers: {},
        tracks: {},
        lastMessage: {},
        telemetryDeviceId: -1,
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
          this.map.addEventListener('zoom', e => {
            if (!e.flyTo) {
              this.flyToZoom = e.target.getZoom()
            }
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
      generateIcon (id, name, color) {
        return L.divIcon({
          className: `my-div-icon icon-${id}`,
          iconSize: new L.Point(20, 20),
          html: `<div style="border-color: ${color}" class="my-div-icon__inner"></div>${this.params.needShowNamesOnMap ? `<div class="my-div-icon__name">${name}</div>` : ''}`
        })
      },
      getColor () {
        let resColor = ''
        if (this.colors[this.currentColor]) {
          resColor = this.colors[this.currentColor]
          this.currentColor++
        }
        else {
          resColor = this.colors[0]
          this.currentColor = 0
        }
        return resColor
      },
      initMarker (id, name, position) {
        let direction = this.messages[id][0]['position.direction'] ? this.messages[id][0]['position.direction'] : 0,
          currentColor = this.tracks[id] ? this.tracks[id].options.color : this.getColor()
        this.markers[id] = L.marker(position, {
          icon: this.generateIcon(id, name, currentColor),
          draggable: this.admin.flag,
          title: name
        })
        this.markers[id].id = id
        this.markers[id].color = currentColor
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
            let icon = document.querySelector(`.icon-${id} .my-div-icon__inner`)
            icon.style.backgroundColor = icon.style.borderColor
          }
        })
        this.markers[id].addEventListener('click', e => {
          this.telemetryDeviceId = parseInt(id)
          this.$emit('update:telemetry-device-id', this.telemetryDeviceId)
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
          this.markers[id].color = this.getColor()
          this.tracks[id] = {}
          return false
        }
        let position = [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']],
          name = currentDevice.name || `#${id}`
        this.initMarker(id, name, position)
        this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), {color: this.markers[id].color}).addTo(this.map)
      },
      updateDeviceOnMap (id) {
        let currentArrPos = this.getLatLngArrByDevice(id),
          markerWatchedPos = this.deviceIdForWatch && this.markers[this.deviceIdForWatch] && this.markers[this.deviceIdForWatch] instanceof L.Marker ? this.markers[this.deviceIdForWatch].getLatLng() : {},
          isWatchedPosChanged = this.deviceIdForWatch && this.messages[this.deviceIdForWatch] && this.messages[this.deviceIdForWatch].length &&
            markerWatchedPos.lat && markerWatchedPos.lat !== this.messages[this.deviceIdForWatch][0]['position.latitude'] &&
            markerWatchedPos.lng && markerWatchedPos.lng !== this.messages[this.deviceIdForWatch][0]['position.longitude']
        if (isWatchedPosChanged) {
          this.map.flyTo(this.getLatLngArrByDevice(this.deviceIdForWatch)[0], this.flyToZoom)
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
          currentPos = currentDevice && currentDevice.telemetry &&
          currentDevice.telemetry['position.latitude'] && currentDevice.telemetry['position.longitude']
            ? [currentDevice.telemetry['position.latitude'].value, currentDevice.telemetry['position.longitude'].value] : []
        if (this.messages[id] && this.messages[id].length) {
          currentPos = [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']]
        }
        if (currentPos.length) {
          this.map.flyTo(currentPos, this.flyToZoom)
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
            elem.style.backgroundColor = ''
          })
          if (this.messages[id] && this.messages[id].length) {
            let icon = document.querySelector(`.my-div-icon.icon-${id} .my-div-icon__inner`)
            icon.style.backgroundColor = icon.style.borderColor
          }
          this.telemetryDeviceId = parseInt(id)
          this.$emit('update:telemetry-device-id', this.telemetryDeviceId)
        }
        else {
          document.querySelectorAll('.my-div-icon__inner').forEach(elem => {
            elem.style.backgroundColor = ''
          })
        }
      },
      'admin.flag': function (flag) {
        if (flag) {
          Object.keys(this.markers).forEach(id => {
            if (this.markers[id] instanceof L.Marker) {
              this.markers[id].dragging.enable()
            }
          })
          Toast.create('Send messages: enabled')
        }
        else {
          Object.keys(this.markers).forEach(id => {
            if (this.markers[id] instanceof L.Marker) {
              this.markers[id].dragging.disable()
            }
          })
          Toast.create('Send messages: disabled')
        }
      },
      'params.needShowNamesOnMap': function (needShowNamesOnMap) {
        Object.keys(this.markers).forEach(id => {
          let currentDevice = this.activeDevices.filter(device => device.id === parseInt(id))[0],
            position = this.messages[id] && this.messages[id].length ? [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']] : [],
            name = currentDevice.name || `#${id}`
          if (this.markers[id] instanceof L.Marker) {
            this.markers[id].remove()
            this.initMarker(id, name, position)
          }
        })
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
    border: 3px solid;
    border-radius: 50% 0 50% 50%;
    background-color: rgba(255, 255, 255, .5);
    height:100%
  }
  .my-div-icon__name {
    line-height: 20px;
    font-size: .9rem;
    font-weight: bolder;
    position: absolute;
    top: 0;
    left: 30px;
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    background-color: rgba(0,0,0,0.5);
    color: #fff;
    border-radius: 5px;
    padding: 0 5px;
    border: 1px solid white
    box-shadow: 3px 3px 10px #999
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
