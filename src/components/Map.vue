<template>
  <div class="map-wrapper absolute-top-left absolute-bottom-right">
    <div id="map" :style="{height: mapHeight}">
      <q-resize-observer @resize="onResize" />
    </div>
    <queue
      ref="queue"
      v-if="Object.keys(messages).length && (params.needShowMessages || params.needShowPlayer)"
      :devices="activeDevices"
      :activeDevicesID="activeDevicesID"
      :needShowMessages="params.needShowMessages"
      :needShowPlayer="params.needShowPlayer"
      :messages="allMessages"
      :telemetryDeviceId="telemetryDeviceId"
      :date="date"
      :markers="markers"
      :player="player"
      @player:value="data => playProcess(data, 'value')"
      @player-play="data => playProcess(data, 'play')"
      @player-pause="data => playProcess(data, 'pause')"
      @player:stop="data => playProcess(data, 'stop')"
      @player-speed="playerSpeedChangeHandler"
      @player-mode="playerModeChange"
      @change-need-show-messages="(flag) => {$emit('change-need-show-messages', flag)}"
      @change:selected="(active) => { selected = active }"
      @update:color="updateColorHandler"
      @view-on-map="viewOnMapHandler"
    />
    <color-modal ref="colorModal" v-model="color"/>
  </div>
</template>

<script>
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.marker.slideto'
import lefleatSnake from '../assets/lefleat-snake'
import Vue from 'vue'
import Queue from './Queue.vue'
import ColorModal from './ColorModal'
import { mapState } from 'vuex'
import { devicesMessagesModule } from 'qvirtualscroll'
import { colors } from 'quasar'
import animate from '../mixins/animate'
import getIconHTML from '../assets/getIconHTML.js'

lefleatSnake(L)

export default {
  name: 'Map',
  props: [
    'params',
    'deviceIdForWatch',
    'activeDevices',
    'delay',
    'date'
  ],
  data () {
    return {
      map: null,
      flyToZoom: 15,
      markers: {},
      tracks: {},
      telemetryDeviceId: -1,
      activeDeviceID: 0,
      activeDevicesID: [],
      selected: null,
      currentColorModel: '#fff',
      currentColorId: 0,
      player: {
        currentMsgIndex: null,
        speed: 10,
        status: 'stop',
        mode: 'time',
        tailInterval: 0
      }
    }
  },
  computed: {
    ...mapState({
      messages (state) {
        return this.activeDevicesID.reduce((result, id) => {
          result[id] = state.messages[id].messages.reduce((result, message, index) => {
            if (!!message['position.latitude'] && !!message['position.longitude']) {
              message['x-flespi-message-index'] = index
              result.push(message)
            }
            return result
          }, [])
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
      if (this.params.needShowMessages && this.params.needShowPlayer) {
        value = 'calc(100% - 113px)'
      } else if (this.params.needShowMessages && !this.params.needShowPlayer) {
        value = 'calc(100% - 48px)'
      } else if (!this.params.needShowMessages && this.params.needShowPlayer) {
        value = 'calc(100% - 65px)'
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
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { minZoom: 3, noWrap: true }).addTo(this.map)
      }
    },
    flyToWithHideTracks (position, zoom) {
      this.map.once('zoomstart', e => {
        Object.keys(this.tracks).forEach((trackId) => {
          const track = this.tracks[trackId]
          if (track instanceof L.Polyline) {
            if (track.tail && track.tail instanceof L.Polyline) {
              this.map.removeLayer(track.tail)
            }
            if (track.overview && track.overview instanceof L.Polyline) {
              this.map.removeLayer(track.overview)
            }
            this.map.removeLayer(track)
          }
        })
      })
      this.map.once('zoomend', e => {
        Object.keys(this.tracks).forEach((trackId) => {
          const track = this.tracks[trackId]
          if (track instanceof L.Polyline) {
            this.map.addLayer(track)
            if (track.tail && track.tail instanceof L.Polyline) {
              this.map.addLayer(track.tail)
            }
            if (track.overview && track.overview instanceof L.Polyline) {
              this.map.addLayer(track.overview)
            }
          }
        })
      })

      this.map.flyTo(position, zoom)
    },
    generateIcon (id, name, color) {
      return L.divIcon({
        className: `my-div-icon icon-${id}`,
        iconSize: new L.Point(20, 35),
        html: getIconHTML(name, color, this.params.needShowNamesOnMap)
      })
    },
    getColor () {
      const letters = '0123456789ABCDEF'
      let color = `#${letters[Math.floor(Math.random() * 5)]}`
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
    setColorById (id, color) {
      let savedColors = this.$q.localStorage.getItem('trackit-colors-settings')
      if (!savedColors) { savedColors = {} }
      savedColors[id] = color
      this.$q.localStorage.set('trackit-colors-settings', savedColors)
      return savedColors[id]
    },
    getAccuracyParams (message) {
      const position = [message['position.latitude'], message['position.longitude']],
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
    updateMarkerDirection (id, dir) {
      if (dir) {
        const element = document.querySelector(`.icon-${id} .my-div-icon__inner`)
        if (element) {
          element.style.transform = `rotate(${(dir || 0)}deg)`
        }
      }
    },
    updateMarker (id, pos, dir) {
      this.updateMarkerDirection(id, dir)
      this.markers[id].setLatLng(pos).update()
    },
    initMarker (id, name, position) {
      const direction = this.messages[id][this.messages[id].length - 1]['position.direction'] ? this.messages[id][this.messages[id].length - 1]['position.direction'] : 0,
        currentColor = this.tracks[id] && this.tracks[id].options ? this.tracks[id].options.color : this.markers[id] ? this.markers[id].color : this.getColorById(id)
      this.markers[id] = L.marker(position, {
        icon: this.generateIcon(id, name, currentColor),
        draggable: false,
        title: name
      })
      this.markers[id].id = id
      this.markers[id].color = currentColor
      const { position: pos, accuracy, circleStyle } = this.getAccuracyParams(this.messages[id][this.messages[id].length - 1])
      this.markers[id].accuracy = L.circle(pos, accuracy, circleStyle)
      this.markers[id].accuracy.addTo(this.map)
      this.markers[id].addEventListener('add', e => {
        this.updateMarkerDirection(id, direction)
        if (this.messages[id] && this.messages[id].length && this.deviceIdForWatch === parseInt(id)) {
          // selected logic
        }
      })
      this.markers[id].addEventListener('click', e => {
        this.telemetryDeviceId = parseInt(id)
        this.$emit('update:telemetry-device-id', this.telemetryDeviceId)
      })
      this.markers[id].addEventListener('move', e => {
        if (this.player.status === 'stop') {
          this.updateMarkerDirection(id, this.messages[id][this.messages[id].length - 1]['position.direction'])
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
      const currentDevice = this.activeDevices.filter(device => device.id === parseInt(id))[0]
      if (!this.markers[id]) {
        this.markers[id] = {}
        this.markers[id].id = id
        this.markers[id].color = this.getColorById(id)
        this.tracks[id] = {}
      }
      const hasInitPosition = this.messages[id] && this.messages[id].length
      if (!hasInitPosition) {
        return false
      }
      const position = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']],
        name = currentDevice.name || `#${id}`
      this.initMarker(id, name, position)
      this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), { color: this.markers[id].color }).addTo(this.map)
      if (parseInt(id) === this.selected) {
        const bounding = this.tracks[id].getBounds()
        this.map.fitBounds(bounding)
      }
    },
    updateDeviceOnMap (id) {
      const currentArrPos = this.getLatLngArrByDevice(id),
        markerWatchedPos = this.deviceIdForWatch && this.markers[this.deviceIdForWatch] && this.markers[this.deviceIdForWatch] instanceof L.Marker ? this.markers[this.deviceIdForWatch].getLatLng() : {},
        isWatchedPosChanged = this.deviceIdForWatch && this.messages[this.deviceIdForWatch] && this.messages[this.deviceIdForWatch].length &&
          markerWatchedPos.lat && markerWatchedPos.lat !== this.messages[this.deviceIdForWatch][this.messages[this.deviceIdForWatch].length - 1]['position.latitude'] &&
          markerWatchedPos.lng && markerWatchedPos.lng !== this.messages[this.deviceIdForWatch][this.messages[this.deviceIdForWatch].length - 1]['position.longitude']
      if (isWatchedPosChanged) {
        const position = currentArrPos[currentArrPos.length - 1]
        this.flyToWithHideTracks(position, this.flyToZoom)
      }
      /* if messages is empty clear marker and line */
      if (!currentArrPos.length) {
        this.removeFlags(id)
        if (this.tracks[id].tail && this.tracks[id].tail instanceof L.Polyline) {
          this.tracks[id].tail.remove()
        }
        if (this.tracks[id].overview && this.tracks[id].overview instanceof L.Polyline) {
          this.tracks[id].overview.remove()
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
        const name = this.activeDevices.filter(device => device.id === parseInt(id))[0].name || `#${id}`,
          position = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
        this.initMarker(id, name, position)
      }
      if (!(this.tracks[id] instanceof L.Polyline)) {
        this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), { color: this.markers[id] ? this.markers[id].color : this.getColorById(id) }).addTo(this.map)
      }
      this.markers[id].setLatLng(currentArrPos[currentArrPos.length - 1]).update()
      this.markers[id].accuracy.setRadius(this.getAccuracyParams(this.messages[id][this.messages[id].length - 1]).accuracy)
      this.markers[id].accuracy.setLatLng(currentArrPos[currentArrPos.length - 1])
      this.markers[id].setOpacity(1)
      this.tracks[id].setLatLngs(currentArrPos)
      if (parseInt(id) === this.selected && !this.$store.state.messages[id].realtimeEnabled) {
        const bounding = this.tracks[id].getBounds()
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
    onResize () {
      if (this.map) {
        this.map.invalidateSize()
      }
    },
    removeMarker (id) {
      if (this.markers[id] && this.markers[id] instanceof L.Marker) {
        this.removeFlags(id)
        this.map.removeLayer(this.markers[id].accuracy)
        this.markers[id].remove()
        if (this.tracks[id].tail && this.tracks[id].tail instanceof L.Polyline) {
          this.tracks[id].tail.remove()
        }
        if (this.tracks[id].overview && this.tracks[id].overview instanceof L.Polyline) {
          this.tracks[id].overview.remove()
        }
        this.tracks[id].remove()
      }
      Vue.delete(this.markers, id)
      Vue.delete(this.tracks, id)
    },
    flyToDevice (id) {
      const devicesById = this.activeDevices.filter(device => device.id === id),
        currentDevice = devicesById.length ? devicesById[0] : null
      let currentPos = currentDevice && []
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
      const devicesById = this.activeDevices.filter(device => device.id === id),
        currentDevice = devicesById.length ? devicesById[0] : null
      let currentPos = currentDevice && []
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
        iconSize: new L.Point(35, 35),
        html: `<i aria-hidden="true" style="color: ${status === 'start' ? colors.getBrand('primary') : colors.getBrand('positive')};" class="my-flag-icon__inner mdi mdi-${status === 'start' ? 'map-marker-outline' : 'map-marker-check'}"></i>`
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
        const startPosition = [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']],
          stopPosition = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
        this.markers[id].flags.start = L.marker(startPosition, {
          icon: this.generateFlag({ id, status: 'start' })
        })
        this.markers[id].flags.start.addTo(this.map)
        this.markers[id].flags.stop = L.marker(stopPosition, {
          icon: this.generateFlag({ id, status: 'stop' })
        })
        const needStopFlag = this.$store.state.messages[id].to <= Date.now()
        needStopFlag && this.markers[id].flags.stop.addTo(this.map)
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
    async getDeviceData (id) {
      if (id) {
        if (this.$store.state.messages[id].realtimeEnabled) {
          await this.$store.dispatch(`messages/${id}/unsubscribePooling`)
        }
        this.$store.commit(`messages/${id}/clearMessages`)
        const from = this.date[0]
        const to = this.date[1]
        this.$store.commit(`messages/${id}/setFrom`, from)
        this.$store.commit(`messages/${id}/setTo`, to)
        await this.$store.dispatch(`messages/${id}/get`)
        if (to > Date.now()) {
          const render = await this.$store.dispatch(`messages/${id}/pollingGet`)
          render()
        }
        this.addFlags(id)
        if (!this.$store.state.messages[id].messages.length) {
          /* try to init device by telemetry */
          await this.$store.dispatch('getInitDataByDeviceId', id)
        }
      }
    },
    async initDevice (id) {
      this.$q.loading.show()
      if (id) {
        this.$store.commit(`messages/${id}/setActive`, id)
        await this.$store.dispatch(`messages/${id}/getCols`, { actions: true, etc: true })
        await this.getDeviceData(id)
      }
      Vue.connector.socket.on('offline', () => { this.$store.commit(`messages/${id}/setOffline`, true) })
      Vue.connector.socket.on('connect', () => {
        if (this.$store.state.messages[id].offline) {
          this.$store.commit(`messages/${id}/setReconnected`, true)
          this.$store.dispatch(`messages/${id}/getMissedMessages`)
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
        const position = [content['position.latitude'], content['position.longitude']],
          icon = L.divIcon({
            className: 'my-highlight-icon',
            iconSize: new L.Point(40, 40),
            html: '<div class="my-highlight-icon__innner"></div>'
          }),
          marker = L.marker(position, {
            icon: icon
          }),
          currentZoom = this.map.getZoom()
        this.flyToWithHideTracks(position, currentZoom > 12 ? currentZoom : 12)
        this.map.once('moveend', () => {
          marker.addTo(this.map)
          const markerElement = document.querySelector('.my-highlight-icon__innner')
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
          message: 'No position',
          color: 'warning',
          position: 'bottom-left',
          icon: 'mdi-alert-outline'
        })
      }
    },
    playProcess (data, type) {
      const mode = this.player.mode === 'data' ? 0 : 1
      switch (type) {
        case 'value': {
          mode ? this.playerTimeValue(data) : this.playerDataValue(data)
          break
        }
        case 'play': {
          if (this.player.status === 'play') { return }
          mode ? this.playerTimePlay(data) : this.playerDataPlay(data)
          break
        }
        case 'stop': {
          if (this.player.status === 'stop') { return }
          mode ? this.playerTimeStop(data) : this.playerDataStop(data)
          break
        }
        case 'pause': {
          if (this.player.status === 'pause') { return }
          mode ? this.playerTimePause(data) : this.playerDataPause(data)
          break
        }
      }
    },
    playerTimeValue ({ id, messagesIndexes }) {
      if (!this.messages[id] || !messagesIndexes || this.player.status !== 'play') { return false }
      let renderDuration = 0,
        lastMessageIndexWithPosition = null
      const endIndex = messagesIndexes[messagesIndexes.length - 1],
        startIndex = 0,
        tailMessages = this.messages[id].slice(startIndex, endIndex + 1),
        tail = tailMessages.reduce((tail, message, index) => {
          if (typeof message['position.latitude'] === 'number' && typeof message['position.longitude'] === 'number') {
            lastMessageIndexWithPosition = index
            tail.push([message['position.latitude'], message['position.longitude']])
          }
          return tail
        }, [])
      messagesIndexes.forEach((messageIndex) => {
        if (this.markers[id] && this.markers[id] instanceof L.Marker) {
          const message = this.messages[id][messageIndex]
          const havePosition = message && typeof message['position.latitude'] === 'number' && typeof message['position.longitude'] === 'number'
          this.player.currentMsgIndex = messageIndex
          if (havePosition) {
            const pos = [message['position.latitude'], message['position.longitude']]
            if (this.player.status === 'play' && messagesIndexes[0] !== 0) {
              let duration = ((1000 / this.player.speed) / messagesIndexes.length)
              if (messageIndex !== 0) {
                const prevTimestamp = this.messages[id][messageIndex - 1].timestamp,
                  currentTimestamp = message.timestamp,
                  durationInSeconds = currentTimestamp - prevTimestamp
                duration = ((durationInSeconds * 1000) / this.player.speed)
                renderDuration = durationInSeconds
              }
              duration = duration - 50
              if (duration) {
                this.markers[id].slideTo(pos, { duration: duration })
              } else {
                this.markers[id].setLatLng(pos).update()
              }
              this.updateMarkerDirection(id, message['position.direction'])
            } else {
              this.markers[id].setLatLng(pos).update()
              this.updateMarker(id, pos, message['position.direction'])
            }
            this.markers[id].accuracy.setRadius(this.getAccuracyParams(message).accuracy)
            this.markers[id].accuracy.setLatLng(pos)
          } else {
            const message = this.messages[id][lastMessageIndexWithPosition]
            const pos = tail[tail.length - 1]
            this.markers[id].setLatLng(pos).update()
            this.updateMarker(id, pos, message['position.direction'])
            this.markers[id].accuracy.setRadius(this.getAccuracyParams(message).accuracy)
            this.markers[id].accuracy.setLatLng(pos)
          }
        }
      })
      /* tail render logic */
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline && tail.length) {
        if (!this.tracks[id].tail || !(this.tracks[id].tail instanceof L.Polyline)) {
          this.tracks[id].tail = L.polyline(tail, this.tracks[id].options)
          this.tracks[id].tail.addTo(this.map)
          return true
        }
        if (this.player.tailInterval) { clearTimeout(this.player.tailInterval) }
        this.player.tailInterval = setTimeout(() => { this.tracks[id].tail && this.tracks[id].tail.setLatLngs(tail) }, ((renderDuration * 700) / this.player.speed))
      }
    },
    playerTimePlay ({ id }) {
      this.tracks[id].remove()
      this.player.status = 'play'
    },
    playerTimeStop ({ id }) {
      if (this.tracks[id].tail) {
        this.tracks[id].tail.remove()
        delete this.tracks[id].tail
      }
      const realtimeEnabled = this.$store.state.messages[id].realtimeEnabled
      const msgIndex = realtimeEnabled ? this.messages[id].length - 1 : 0
      const message = this.messages[id][msgIndex]
      this.$nextTick(() => { this.player.currentMsgIndex = msgIndex ? null : 0 })
      this.player.status = 'stop'
      this.tracks[id].addTo(this.map)
      const lastPos = [message['position.latitude'], message['position.longitude']]
      this.updateMarker(id, lastPos, message['position.direction'])
    },
    playerTimePause ({ id }) {
      this.player.status = 'pause'
    },
    playerDataValue ({ id }) {},
    playerDataPlay ({ id }) {
      if (this.player.status === 'pause') {
        this.tracks[id].overview.snakeUnpause()
        this.player.status = 'play'
        return
      }
      this.player.status = 'play'
      this.tracks[id].remove()
      const latlngs = this.messages[id].map(message => ({
        lat: message['position.latitude'],
        lng: message['position.longitude'],
        dir: message['position.direction'],
        index: message['x-flespi-message-index']
      }))
      if (latlngs.length < 2) {
        this.tracks[id].addTo(this.map)
        this.player.status = 'stop'
        this.player.currentMsgIndex = null
        return
      }
      const line = L.polyline(latlngs, { snakingSpeed: 20 * this.player.speed, color: this.tracks[id].options.color })
      this.tracks[id].overview = line
      line.addTo(this.map).snakeIn()
      line.on('snake', () => {
        const points = line.getLatLngs()
        const point = points.slice(-1)[0]
        const lastPos = point.slice(-1)[0]
        const message = latlngs[points[0].length - 1]
        this.updateMarker(id, lastPos, message.dir)
        if (this.player.currentMsgIndex !== message.index) {
          this.player.currentMsgIndex = message.index
        }
      })
      line.on('snakeInEnd', () => {
        this.playerDataStop({ id })
      })
    },
    playerDataStop ({ id }) {
      this.player.status = 'stop'
      if (this.tracks[id].overview) {
        this.tracks[id].overview.remove()
        delete this.tracks[id].overview
      }
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
        this.tracks[id].addTo(this.map)
      }
      const message = this.messages[id].slice(-1)[0]
      this.player.currentMsgIndex = null
      if (message) {
        const lastPos = [message['position.latitude'], message['position.longitude']]
        this.updateMarker(id, lastPos, message['position.direction'])
      }
    },
    playerDataPause ({ id }) {
      if (this.player.status === 'stop') { return }
      this.player.status = 'pause'
      this.tracks[id].overview.snakePause()
    },
    playerSpeedChangeHandler ({ speed, id }) {
      this.player.speed = speed
      if (this.player.mode === 'data' && this.player.status !== 'stop') {
        this.tracks[id].overview.setStyle({ snakingSpeed: 20 * speed })
      }
    },
    playerModeChange ({ id, mode }) {
      if (this.player.status !== 'stop') {
        if (mode === 'data') {
          this.playerTimeStop({ id })
        } else {
          this.playerDataStop({ id })
        }
      }
      this.player.mode = mode
    },
    updateColorHandler ({ id, color }) {
      this.tracks[id].setStyle({ color })
      this.tracks[id].tail && this.tracks[id].tail.setStyle({ color })
      this.tracks[id].overview && this.tracks[id].overview.setStyle({ color })
      this.markers[id].color = color
      this.markers[id].setIcon(this.generateIcon(id, this.markers[id].options.title, color))
      this.setColorById(id, color)
    }
  },
  watch: {
    messages: {
      deep: true,
      handler (messages) {
        if (this.player.status === 'play' || this.player.status === 'pause') { return false }
        const keyArr = Object.keys(messages),
          oldKeyArr = Object.keys(this.markers)
        if (!keyArr.length) {
          Object.keys(this.markers).forEach(id => {
            this.removeMarker(id)
          })
          return false
        }
        if (keyArr.length < oldKeyArr.length) {
          const removeDeviceId = oldKeyArr.filter(key => !keyArr.includes(key))[0]
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
      const activeDevicesID = newVal.map((device) => device.id)
      if (!this.activeDeviceID) {
        activeDevicesID.forEach((id) => { this.initActiveDeviceID(id) })
      }
      const currentDevicesID = Object.keys(this.messages).map(id => parseInt(id)),
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
          const removedDevicesID = currentDevicesID.filter(id => !activeDevicesID.includes(id))
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
          const addedDeviceID = activeDevicesID.filter(id => !currentDevicesID.includes(id))
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
      }
    },
    'params.needShowNamesOnMap': function (needShowNamesOnMap) {
      Object.keys(this.markers).forEach(id => {
        const currentDevice = this.activeDevices.filter(device => device.id === parseInt(id))[0],
          position = this.messages[id] && this.messages[id].length ? [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']] : [],
          name = currentDevice.name || `#${id}`
        if (this.markers[id] instanceof L.Marker) {
          this.markers[id].remove()
          this.map.removeLayer(this.markers[id].accuracy)
          this.initMarker(id, name, position)
        }
      })
    },
    date (date, prev) {
      if (prev) {
        this.player.status = 'stop'
        this.player.currentMsgIndex = null
        this.activeDevicesID.forEach(async (id) => {
          await this.getDeviceData(id)
        })
      }
    },
    selected (active) {
      if (this.tracks[active] && this.tracks[active] instanceof L.Polyline) {
        const bounding = this.tracks[active].getBounds()
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
  components: { Queue, ColorModal }
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
  .my-flag-icon__inner
    font-size 35px
    position relative
    top -20px
    left 2px
  .my-div-icon
    z-index 2000!important
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
