<template>
  <div class="map-wrapper absolute-top-left absolute-bottom-right">
    <div id="map" :style="{height: mapHeight}">
      <q-resize-observer @resize="onResize" />
    </div>
    <queue
      ref="queue"
      v-if="Object.keys(messages).length && ((mode === 0 && (params.needShowMessages || params.needShowPlayer)) || (mode === 1 && params.needShowMessages))"
      :devices="activeDevices"
      :activeDevicesID="activeDevicesID"
      :needShowMessages="params.needShowMessages"
      :needShowPlayer="params.needShowPlayer"
      :messages="allMessages"
      :isAdmin="admin.flag"
      :telemetryDeviceId="telemetryDeviceId"
      :mode="mode"
      :date="date"
      :markers="markers"
      @send="prepareForSendMessage"
      @play="playHandler"
      @stop="stopHandler"
      @change:needShowTail="changeShowTail"
      @change:needShowMessages="(flag) => {$emit('change:needShowMessages', flag)}"
      @change:selected="(active) => { selected = active }"
      @update:color="updateColorHandler"
      @view-on-map="viewOnMapHandler"
    />
    <post-message-modal
      ref="postMessageModal"
      :currentPos="draggedMarker.markerCurrentPosition"
      :deviceID="draggedMarker.markerID"
      :lastMessage="lastMessage"
      @update:marker="updateMarkerHandler"
      @update:dragged="updateFlagHandler"
    />
    <color-modal ref="colorModal" v-model="color"/>
  </div>
</template>

<script>
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Vue from 'vue'
import Queue from './Queue.vue'
import PostMessageModal from './PostMessageModal.vue'
import ColorModal from './ColorModal'
import { mapState } from 'vuex'
import { devicesMessagesModule } from 'qvirtualscroll'
import { colors } from 'quasar'
import animate from '../mixins/animate'

export default {
  name: 'Map',
  props: [
    'params',
    'deviceIdForWatch',
    'activeDevices',
    'delay',
    'mode',
    'date'
  ],
  data () {
    return {
      isDragged: false,
      map: null,
      flyToZoom: 15,
      markers: {},
      tracks: {},
      lastMessage: {},
      telemetryDeviceId: -1,
      activeDeviceID: 0,
      activeDevicesID: [],
      draggedMarker: {
        markerCurrentPosition: [],
        markerID: 0
      },
      openModalFlag: false,
      admin: {
        flag: false,
        counter: 0,
        timerId: 0
      },
      needShowTail: false,
      selected: null,
      currentColorModel: '#fff',
      currentColorId: 0
    }
  },
  computed: {
    ...mapState({
      messages (state) {
        return this.activeDevicesID.reduce((result, id) => {
          result[id] = state.messages[id].messages.filter((message) => {
            return !!message['position.latitude'] && !!message['position.longitude']
          })
          return result
        }, {})
      },
      allMessages (state) {
        return this.activeDevicesID.reduce((result, id) => {
          result[id] = state.messages[id].messages
          return result
        }, {})
      }
    }),
    color: {
      get () { return this.currentColorModel },
      set (color) {
        this.updateColorHandler({ id: this.currentColorId, color })
        this.currentColorModel = color
      }
    },
    mapHeight () {
      let value = '100%'
      if (!this.activeDevices.length) { return value }
      if (this.mode === 1) {
        if (this.params.needShowMessages) {
          value = 'calc(100% - 48px)'
        }
      } else if (this.mode === 0) {
        if (this.params.needShowMessages && this.params.needShowPlayer) {
          value = 'calc(100% - 113px)'
        } else if (this.params.needShowMessages && !this.params.needShowPlayer) {
          value = 'calc(100% - 48px)'
        } else if (!this.params.needShowMessages && this.params.needShowPlayer) {
          value = 'calc(100% - 65px)'
        }
      }
      return value
    }
  },
  methods: {
    initMap () {
      if (!this.map) {
        this.map = L.map('map', {
          center: [51.50853, -0.12574],
          zoom: 3,
          maxBounds: [
            [90, -180],
            [-90, 180]
          ]
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
            this.$refs.postMessageModal.show()
            this.$emit('update:send-active', null)
          }
          // admin logic
          this.admin.counter += 1
          this.admin.timerId = setTimeout(() => {
            if (this.admin.timerId && this.admin.counter >= 10) {
              /* uncomment after returning POST messages devices */
              // this.admin.flag = !this.admin.flag
            }
            this.admin.timerId = 0
            this.admin.counter = 0
          }, 2000)
        })
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { minZoom: 3, noWrap: true }).addTo(this.map)
      }
    },
    flyToWithHideTracks (position, zoom) {
      this.map.once('zoomstart', e => {
        Object.keys(this.tracks).forEach((trackId) => {
          let track = this.tracks[trackId]
          if (track instanceof L.Polyline) {
            if (track.tail && track.tail instanceof L.Polyline) {
              this.map.removeLayer(track.tail)
            }
            this.map.removeLayer(track)
          }
        })
      })
      this.map.once('zoomend', e => {
        Object.keys(this.tracks).forEach((trackId) => {
          let track = this.tracks[trackId]
          if (track instanceof L.Polyline) {
            this.map.addLayer(track)
            if (track.tail && track.tail instanceof L.Polyline) {
              this.map.addLayer(track.tail)
            }
          }
        })
      })

      this.map.flyTo(position, zoom)
    },
    generateIcon (id, name, color) {
      return L.divIcon({
        className: `my-div-icon icon-${id}`,
        iconSize: new L.Point(20, 20),
        html: `<div style="border-color: ${color}" class="my-div-icon__inner"></div>${this.params.needShowNamesOnMap ? `<div class="my-div-icon__name">${name}</div>` : ''}`
      })
    },
    getColor () {
      let letters = '0123456789ABCDEF',
        color = `#${letters[Math.floor(Math.random() * 5)]}`
      for (let i = 0; i < 5; i++) {
        color += letters[Math.floor(Math.random() * 15)]
      }
      return color
    },
    getColorById (id) {
      let savedColors = this.$q.localStorage.getItem('trackit-colors-settings')
      if (!savedColors) { savedColors = {} }
      if (!savedColors[id]) {
        savedColors[id] = this.getColor()
      }
      this.$q.localStorage.set('trackit-colors-settings', savedColors)
      return savedColors[id]
    },
    getAccuracyParams (message) {
      let position = [message['position.latitude'], message['position.longitude']],
        accuracy = message['position.hdop'] || message['position.pdop'] || 0,
        circleStyle = {
          stroke: true,
          color: '#444',
          weight: 3,
          opacity: 0.5,
          fillOpacity: 0.15,
          fillColor: '#444',
          clickable: false
        }
      return { position, accuracy, circleStyle }
    },
    initMarker (id, name, position) {
      let direction = this.messages[id][this.messages[id].length - 1]['position.direction'] ? this.messages[id][this.messages[id].length - 1]['position.direction'] : 0,
        currentColor = this.tracks[id] && this.tracks[id].options ? this.tracks[id].options.color : this.markers[id] ? this.markers[id].color : this.getColorById(id)
      this.markers[id] = L.marker(position, {
        icon: this.generateIcon(id, name, currentColor),
        draggable: this.admin.flag,
        title: name
      })
      this.markers[id].id = id
      this.markers[id].color = currentColor
      let { position: pos, accuracy, circleStyle } = this.getAccuracyParams(this.messages[id][this.messages[id].length - 1])
      this.markers[id].accuracy = L.circle(pos, accuracy, circleStyle)
      this.markers[id].accuracy.addTo(this.map)
      this.markers[id].addEventListener('dragstart', (e) => {
        this.isDragged = true
      })
      this.markers[id].addEventListener('dragend', e => {
        if (this.mode === 0) {
          this.$q.notify({ message: 'Change mode to real-time', color: 'warning' })
          const position = [
            this.messages[e.target.id][this.messages[e.target.id].length - 1]['position.latitude'],
            this.messages[e.target.id][this.messages[e.target.id].length - 1]['position.longitude']
          ]
          this.markers[e.target.id].setLatLng(position).update()
          return false
        }
        this.draggedMarker.markerCurrentPosition = e.target.getLatLng()
        this.draggedMarker.markerID = e.target.id
        this.lastMessage = this.messages[e.target.id][this.messages[e.target.id].length - 1] ? this.messages[e.target.id][this.messages[e.target.id].length - 1] : {}
        this.$refs.postMessageModal.show()
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
        if (this.mode === 1) {
          document.querySelector(`.icon-${id} .my-div-icon__inner`).style.transform = `rotate(${(this.messages[id][this.messages[id].length - 1]['position.direction'] ? this.messages[id][this.messages[id].length - 1]['position.direction'] : 0) - 45}deg)`
        }
      })
      this.markers[id].addEventListener('contextmenu', e => {
        this.currentColorId = id
        this.currentColorModel = this.markers[id].color
        this.$refs.colorModal.show()
      })
      this.markers[id].addTo(this.map)
    },
    initDeviceOnMap (id) {
      let currentDevice = this.activeDevices.filter(device => device.id === parseInt(id))[0]
      if (!this.markers[id]) {
        this.markers[id] = {}
        this.markers[id].id = id
        this.markers[id].color = this.getColorById(id)
        this.tracks[id] = {}
      }
      let hasInitPosition = this.messages[id] && this.messages[id].length
      if (!hasInitPosition) {
        return false
      }
      let position = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']],
        name = currentDevice.name || `#${id}`
      this.initMarker(id, name, position)
      this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), { color: this.markers[id].color }).addTo(this.map)
      if (parseInt(id) === this.selected && this.mode === 0) {
        let bounding = this.tracks[id].getBounds()
        this.map.fitBounds(bounding)
      }
    },
    updateDeviceOnMap (id) {
      let currentArrPos = this.getLatLngArrByDevice(id),
        markerWatchedPos = this.deviceIdForWatch && this.markers[this.deviceIdForWatch] && this.markers[this.deviceIdForWatch] instanceof L.Marker ? this.markers[this.deviceIdForWatch].getLatLng() : {},
        isWatchedPosChanged = this.deviceIdForWatch && this.messages[this.deviceIdForWatch] && this.messages[this.deviceIdForWatch].length &&
          markerWatchedPos.lat && markerWatchedPos.lat !== this.messages[this.deviceIdForWatch][this.messages[this.deviceIdForWatch].length - 1]['position.latitude'] &&
          markerWatchedPos.lng && markerWatchedPos.lng !== this.messages[this.deviceIdForWatch][this.messages[this.deviceIdForWatch].length - 1]['position.longitude']
      if (isWatchedPosChanged) {
        let position = currentArrPos[currentArrPos.length - 1]
        this.flyToWithHideTracks(position, this.flyToZoom)
      }
      /* if messages is empty clear marker and line */
      if (!currentArrPos.length) {
        this.removeFlags(id)
        if (this.tracks[id].tail && this.tracks[id].tail instanceof L.Polyline) {
          this.tracks[id].tail.remove()
        }
        if (this.markers[id].accuracy) {
          this.map.removeLayer(this.markers[id].accuracy)
        }
        this.map.removeLayer(this.tracks[id])
        this.map.removeLayer(this.markers[id])
        this.tracks[id] = {}
        this.markers[id] = {
          color: this.markers[id].color || undefined,
          id: id
        }
        return false
      }
      if (!(this.markers[id] instanceof L.Marker)) {
        let name = this.activeDevices.filter(device => device.id === parseInt(id))[0].name || `#${id}`,
          position = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
        this.initMarker(id, name, position)
      }
      if (!(this.tracks[id] instanceof L.Polyline)) {
        this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), { color: this.markers[id] ? this.markers[id].color : this.getColorById(id) }).addTo(this.map)
      }
      if (!this.isDragged) {
        this.markers[id].setLatLng(currentArrPos[currentArrPos.length - 1]).update()
        this.markers[id].accuracy.setRadius(this.getAccuracyParams(this.messages[id][this.messages[id].length - 1]).accuracy)
        this.markers[id].accuracy.setLatLng(currentArrPos[currentArrPos.length - 1])
      }
      this.markers[id].setOpacity(1)
      this.tracks[id].setLatLngs(currentArrPos)
      if (parseInt(id) === this.selected && this.mode === 0) {
        let bounding = this.tracks[id].getBounds()
        this.map.fitBounds(bounding)
      }
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
      this.lastMessage = this.messages[id] && this.messages[id][this.messages[id].length - 1] ? this.messages[id][this.messages[id].length - 1] : {}
      L.DomUtil.addClass(this.map._container, 'crosshair-cursor-enabled')
    },
    onResize () {
      if (this.map) {
        this.map.invalidateSize()
      }
    },
    updateMarkerHandler ({ id, lastPos }) {
      if (this.markers[id] && this.markers[id] instanceof L.Marker) {
        this.markers[id].setLatLng(lastPos).update()
        this.markers[id].accuracy.setLatLng(lastPos)
      } else {
        this.initDeviceOnMap(id)
      }
    },
    updateFlagHandler (value) {
      this.isDragged = value
    },
    removeMarker (id) {
      if (this.markers[id] && this.markers[id] instanceof L.Marker) {
        this.removeFlags(id)
        this.map.removeLayer(this.markers[id].accuracy)
        this.markers[id].remove()
        if (this.tracks[id].tail && this.tracks[id].tail instanceof L.Polyline) {
          this.tracks[id].tail.remove()
        }
        this.tracks[id].remove()
      }
      Vue.delete(this.markers, id)
      Vue.delete(this.tracks, id)
    },
    flyToDevice (id) {
      let devicesById = this.activeDevices.filter(device => device.id === id),
        currentDevice = devicesById.length ? devicesById[0] : null,
        currentPos = currentDevice && []
      if (this.messages[id] && this.messages[id].length) {
        currentPos = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
      }
      if (currentPos.length) {
        this.flyToWithHideTracks(currentPos, this.flyToZoom)
      } else {
        this.$q.notify({ message: 'No Position!', color: 'warning' })
      }
    },
    centerOnDevice (id) {
      let devicesById = this.activeDevices.filter(device => device.id === id),
        currentDevice = devicesById.length ? devicesById[0] : null,
        currentPos = currentDevice && []
      if (this.messages[id] && this.messages[id].length) {
        currentPos = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
      }
      if (currentPos.length) {
        this.map.setView(currentPos, 14, { animation: false })
      } else {
        this.$q.notify({ message: 'No Position!', color: 'warning' })
      }
    },
    generateFlag ({ id, status }) {
      return L.divIcon({
        className: `my-flag-icon flag-${status}-${id}`,
        iconSize: new L.Point(45, 45),
        html: `<i aria-hidden="true" style="color: ${status === 'start' ? colors.getBrand('positive') : colors.getBrand('negative')};" class="my-flag-icon__inner mdi mdi-flag-variant-outline"></i>`
      })
    },
    addFlags (id) {
      if (!this.markers[id]) {
        return false
      }
      if (!this.markers[id].flags) {
        this.markers[id].flags = {
          start: {},
          stop: {}
        }
      }
      if (this.messages[id].length) {
        let startPosition = [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']],
          stopPosition = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
        this.markers[id].flags.start = L.marker(startPosition, {
          icon: this.generateFlag({ id, status: 'start' })
        })
        this.markers[id].flags.start.addTo(this.map)
        this.markers[id].flags.stop = L.marker(stopPosition, {
          icon: this.generateFlag({ id, status: 'stop' })
        })
        this.markers[id].flags.stop.addTo(this.map)
      }
    },
    removeFlags (id) {
      if (!this.markers[id] || !this.markers[id].flags || !(this.markers[id].flags.start instanceof L.Marker) || !(this.markers[id].flags.stop instanceof L.Marker)) {
        return false
      }
      this.markers[id].flags.start.remove()
      this.markers[id].flags.stop.remove()
      this.markers[id].flags = undefined
    },
    async modeChangeById (id) {
      let isNullMode = this.$store.state.messages[id].mode !== null
      this.$store.commit(`messages/${id}/clearMessages`)
      this.$store.commit(`messages/${id}/setMode`, this.mode)
      if (this.mode === 1 && isNullMode) {
        this.$store.commit(`messages/${id}/setTo`, Date.now())
        await this.$store.dispatch(`messages/${id}/getHistory`, 200)
        if (!this.$store.state.messages[id].messages.length) {
          /* try to init device by telemetry */
          await this.$store.dispatch('getInitDataByDeviceId', id)
        }
      }
      if (this.mode === 0) {
        let from = new Date(this.date).setHours(0, 0, 0, 0)
        let to = from + 86399999
        this.$store.commit(`messages/${id}/setFrom`, from)
        this.$store.commit(`messages/${id}/setTo`, to)
        await this.$store.dispatch(`messages/${id}/get`)
        this.addFlags(id)
      }
    },
    async initDevice (id) {
      this.$q.loading.show()
      if (id) {
        this.$store.commit(`messages/${id}/setActive`, id)
        await this.$store.dispatch(`messages/${id}/getCols`)
      }
      if (this.$store.state.messages[id].mode === null) {
        await this.modeChangeById(id)
        await this.$store.dispatch(`messages/${id}/pollingGet`)
        if (this.mode === 1) {
          await this.$store.dispatch(`messages/${id}/getHistory`, 200)
          if (!this.$store.state.messages[id].messages.length) {
            /* try to init device by telemetry */
            await this.$store.dispatch('getInitDataByDeviceId', id)
          }
        }
      }
      Vue.connector.socket.on('offline', () => { this.$store.commit(`messages/${id}/setOffline`, this.mode === 1) })
      Vue.connector.socket.on('connect', () => {
        if (this.$store.state.messages[id].offline) {
          this.$store.commit(`messages/${id}/setReconnected`, this.mode === 1)
          if (this.mode === 1) {
            this.$store.dispatch(`messages/${id}/getMissedMessages`)
          }
        }
      })
      if (this.needInitWatchingDevice && id === this.deviceIdForWatch) {
        this.telemetryDeviceId = parseInt(id)
        this.$emit('update:telemetry-device-id', this.telemetryDeviceId)
        this.centerOnDevice(id)
      }
      this.$q.loading.hide()
    },
    initActiveDeviceID (id) {
      this.activeDeviceID = id || 0
    },
    viewOnMapHandler (content) {
      if (content['position.latitude'] && content['position.longitude']) {
        let position = [content['position.latitude'], content['position.longitude']],
          icon = L.divIcon({
            className: `my-highlight-icon`,
            iconSize: new L.Point(40, 40),
            html: `<div class="my-highlight-icon__innner"></div>`
          }),
          marker = L.marker(position, {
            icon: icon
          }),
          currentZoom = this.map.getZoom()
        this.flyToWithHideTracks(position, currentZoom > 12 ? currentZoom : 12)
        this.map.once('moveend', () => {
          marker.addTo(this.map)
          let markerElement = document.querySelector('.my-highlight-icon__innner')
          animate.start({
            from: 20,
            to: 40,
            duration: 500,
            apply (pos) {
              markerElement.style.height = `${pos}px`
              markerElement.style.width = `${pos}px`
              markerElement.style.transform = `translate(${(40 - pos) / 2}px, ${(40 - pos) / 2}px)`
            },
            done () {
              marker.remove()
            }
          })
        })
      } else {
        this.$q.notify({
          message: 'Have no position',
          color: 'warning',
          position: 'bottom-left',
          icon: 'mdi-alert-outline'
        })
      }
    },
    playHandler ({ id, messagesIndexes }) {
      if (!this.messages[id]) { return false }
      messagesIndexes.forEach((messageIndex) => {
        if (this.markers[id] && this.markers[id] instanceof L.Marker) {
          let message = this.messages[id][messageIndex]
          if (!message || !message['position.latitude'] || !message['position.longitude']) { return false }
          let pos = [message['position.latitude'], message['position.longitude']]
          this.markers[id].setLatLng(pos).update()
          this.markers[id].accuracy.setRadius(this.getAccuracyParams(message).accuracy)
          this.markers[id].accuracy.setLatLng(pos)
          if (message['position.direction']) {
            let element = document.querySelector(`.icon-${id} .my-div-icon__inner`)
            if (element) {
              element.style.transform = `rotate(${(message['position.direction'] ? message['position.direction'] : 0) - 45}deg)`
            }
          }
        }
      })
      /* tail render logic */
      let endIndex = messagesIndexes[messagesIndexes.length - 1],
        startIndex = endIndex - 10 < 0 ? 0 : endIndex - 10,
        tailMessages = this.messages[id].slice(startIndex, endIndex + 1),
        tail = tailMessages.map(message => {
          return [message['position.latitude'], message['position.longitude']]
        })
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline && tail.length) {
        if (!this.tracks[id].tail || !(this.tracks[id].tail instanceof L.Polyline)) {
          this.tracks[id].tail = L.polyline(tail, { color: '#666666' })
          if (this.needShowTail) {
            this.tracks[id].tail.addTo(this.map)
          }
          return true
        }
        this.tracks[id].tail.setLatLngs(tail)
      }
    },
    stopHandler ({ id }) {
      // this.updateDeviceOnMap(id)
    },
    changeShowTail (flag) {
      Object.keys(this.tracks).forEach((trackId) => {
        if (this.tracks[trackId] && this.tracks[trackId].tail && this.tracks[trackId].tail instanceof L.Polyline) {
          flag ? this.tracks[trackId].tail.addTo(this.map) : this.tracks[trackId].tail.remove()
        }
      })
    },
    updateColorHandler ({ id, color }) {
      this.tracks[id].setStyle({ color })
      this.markers[id].color = color
      document.querySelector(`.my-div-icon.icon-${id} .my-div-icon__inner`).style.borderColor = color
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
            } else {
              this.updateDeviceOnMap(id)
            }
            return false
          }
          if (oldKeyArr.includes(id)) {
            this.updateDeviceOnMap(id)
          } else {
            this.initDeviceOnMap(id)
          }
        })
      }
    },
    activeDevices (newVal) {
      let activeDevicesID = newVal.map((device) => device.id)
      if (!this.activeDeviceID) {
        activeDevicesID.forEach((id) => { this.initActiveDeviceID(id) })
      }
      let currentDevicesID = Object.keys(this.messages).map(id => parseInt(id)),
        modifyType = currentDevicesID.length > activeDevicesID.length ? 'remove' : 'add'
      activeDevicesID.forEach((id) => {
        if (!this.$store.state.messages[id]) {
          this.$store.registerModule(['messages', id], devicesMessagesModule({ Vue, LocalStorage: this.$q.localStorage, name: `messages/${id}`, errorHandler: (err) => { this.$store.commit('reqFailed', err) } }))
          this.$store.commit(`messages/${id}/setSortBy`, 'timestamp')
          this.$store.commit(`messages/${id}/setLimit`, 0)
        }
      })
      this.activeDevicesID = activeDevicesID
      switch (modifyType) {
        case 'remove': {
          let removedDevicesID = currentDevicesID.filter(id => !activeDevicesID.includes(id))
          if (removedDevicesID.length === 1 && removedDevicesID[0]) {
            this.$store.commit(`messages/${removedDevicesID[0]}/clear`)
          } else if (removedDevicesID.length === currentDevicesID.length) {
            removedDevicesID.forEach((id) => {
              this.$store.commit(`messages/${id}/clear`)
            })
          }
          break
        }
        case 'add': {
          let addedDeviceID = activeDevicesID.filter(id => !currentDevicesID.includes(id))
          if (addedDeviceID) {
            addedDeviceID.forEach((id) => { this.initDevice(id) })
          }
          break
        }
      }
      if (this.map && L.DomUtil.hasClass(this.map._container, 'crosshair-cursor-enabled')) {
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
      } else {
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
        this.$q.notify({
          message: 'Send messages: enabled',
          color: 'info',
          position: 'bottom-left'
        })
      } else {
        Object.keys(this.markers).forEach(id => {
          if (this.markers[id] instanceof L.Marker) {
            this.markers[id].dragging.disable()
          }
        })
        this.$q.notify({
          message: 'Send messages: disabled',
          color: 'info',
          position: 'bottom-left'
        })
      }
    },
    'params.needShowNamesOnMap': function (needShowNamesOnMap) {
      Object.keys(this.markers).forEach(id => {
        let currentDevice = this.activeDevices.filter(device => device.id === parseInt(id))[0],
          position = this.messages[id] && this.messages[id].length ? [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']] : [],
          name = currentDevice.name || `#${id}`
        if (this.markers[id] instanceof L.Marker) {
          this.markers[id].remove()
          this.map.removeLayer(this.markers[id].accuracy)
          this.initMarker(id, name, position)
        }
      })
    },
    mode () {
      this.activeDevicesID.forEach(async (id) => {
        await this.modeChangeById(id)
      })
    },
    date (date, prev) {
      if (this.mode === 0 && prev) {
        this.activeDevicesID.forEach(async (id) => {
          await this.modeChangeById(id)
        })
      }
    },
    selected (active) {
      if (this.tracks[active] && this.tracks[active] instanceof L.Polyline && this.mode === 0) {
        let bounding = this.tracks[active].getBounds()
        this.map.fitBounds(bounding)
      }
    }
  },
  created () {
    if (this.deviceIdForWatch) {
      this.needInitWatchingDevice = true
    }
    this.activeDevicesID = this.activeDevices.map((device) => device.id)
    this.activeDevicesID.forEach((id) => {
      this.$store.registerModule(['messages', id], devicesMessagesModule({ Vue, LocalStorage: this.$q.localStorage, name: `messages/${id}`, errorHandler: (err) => { this.$store.commit('reqFailed', err) } }))
      this.$store.commit(`messages/${id}/setSortBy`, 'timestamp')
      this.initDevice(id)
    })
    Vue.connector.socket.on('offline', () => {
      this.$store.commit('setSocketOffline', true)
    })
    Vue.connector.socket.on('connect', () => {
      this.$store.commit('setSocketOffline', false)
    })
  },
  destroyed () {
    Vue.connector.socket.off('offline')
    Vue.connector.socket.off('connect')
    this.activeDevicesID.forEach(async (id) => {
      this.$store.unregisterModule(['messages', id])
    })
  },
  mounted () {
    this.initMap()
  },
  components: { Queue, PostMessageModal, ColorModal }
}
</script>

<style lang="stylus">
  .leaflet-container.crosshair-cursor-enabled
    cursor crosshair
  .leaflet-control-zoom.leaflet-bar
    top 50px
    left 6px
    border none
    .leaflet-control-zoom-in, .leaflet-control-zoom-out
      background-color #fff
      color #333
      border-color #666
      box-shadow 0 0 15px rgba(0,0,0,0.5)
    .leaflet-control-zoom-in
      border-top-left-radius 3px
      border-top-right-radius 3px
    .leaflet-control-zoom-out
      border-bottom-left-radius 3px
      border-bottom-right-radius 3px
  .my-div-icon__inner
    border 3px solid
    border-radius 50% 0 50% 50%
    background-color rgba(255, 255, 255, .5)
    height 100%
    box-shadow white 0 0 5px
  .my-flag-icon__inner
    font-size 45px
    position relative
    top -25px
    left 10px
  .my-div-icon__name
    line-height 20px
    font-size .9rem
    font-weight bolder
    position absolute
    top 0
    left 30px
    max-width 200px
    text-overflow ellipsis
    overflow hidden
    background-color rgba(0,0,0,0.5)
    color #fff
    border-radius 5px
    padding 0 5px
    border 1px solid white
    box-shadow 3px 3px 10px #999
  .direction
    border 2px solid black
    border-radius 50% 0 50% 50%
    background-color white
    opacity .5
    height 20px
    width 20px
  .my-highlight-icon__innner
    height 20px
    width 20px
    background-color blue
    opacity .5
    transform translate(10px, 10px)
    border-radius 50%
</style>
