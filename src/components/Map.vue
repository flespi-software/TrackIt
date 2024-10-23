<template>
  <div class="map-wrapper absolute-top-left absolute-bottom-right">
    <div id="map" :style="{height: mapHeight}">
      <q-resize-observer @resize="onResize" />
    </div>
    <queue
      ref="queue"
      v-if="Object.keys(messages).length && activeDevicesID.length"
      :activeDevicesID="activeDevicesID"
      :needShowMessages="params.needShowMessages"
      :needShowPlayer="params.needShowPlayer"
      :messages="allMessages"
      :selectedDeviceId="selectedDeviceId"
      :telemetryDeviceId="telemetryDeviceId"
      :date="date"
      :player="player"
      @player-value="data => playProcess(data, 'value')"
      @player-play="data => playProcess(data, 'play')"
      @player-pause="data => playProcess(data, 'pause')"
      @player-stop="data => playProcess(data, 'stop')"
      @player-speed="playerSpeedChangeHandler"
      @player-mode="playerModeChange"
      @change-need-show-messages="(flag) => {$emit('change-need-show-messages', flag)}"
      @queue-created="$emit('queue-created')"
      @update-color="updateColorHandler"
      @view-on-map="viewOnMapHandler"
    />
    <color-modal ref="colorModal" v-model="color"/>
  </div>
</template>

<script>
import * as L from 'leaflet'
import 'leaflet-geometryutil'
import 'leaflet/dist/leaflet.css'
import 'leaflet.marker.slideto'
import 'leaflet.polylinemeasure/Leaflet.PolylineMeasure.css'
import 'leaflet.polylinemeasure/Leaflet.PolylineMeasure'
import lefleatSnake from '../assets/lefleat-snake'
import Vue from 'vue'
import Queue from './Queue.vue'
import ColorModal from './ColorModal'
import { mapState } from 'vuex'
import devicesMessagesModule from 'qvirtualscroll/src/store/modules/devicesMessages'
import { colors, debounce } from 'quasar'
import getIconHTML from '../assets/getIconHTML.js'
import { getFromStore, setToStore } from '../mixins/store'

lefleatSnake(L)

export default {
  name: 'Map',
  props: [
    'params',
    'devicesColors',
    'selectedDeviceId',
    'isSelectedDeviceFollowed',
    'activeDevices',
    'delay',
    'date'
  ],
  data () {
    return {
      map: null,
      flyToZoom: 15,
      isFlying: null,
      markers: {},
      tracks: {},
      telemetryDeviceId: -1,
      activeDevicesID: [],
      devicesState: {},
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
              // pass message to the map only if it has position.latitude and position.longitude
              if (!this.params.needShowInvalidPositionMessages) {
                // don't pass messages with position.valid=false to the map
                if (!message.hasOwnProperty('position.valid') || (message.hasOwnProperty('position.valid') && message['position.valid'] === true)) {
                  // pass messages to the map disregarding pasition.valid parameter
                  Object.defineProperty(message, 'x-flespi-message-index', {
                    value: index,
                    enumerable: false
                  })
                  result.push(message)
                }
              } else {
                // pass messages to the map disregarding pasition.valid parameter
                Object.defineProperty(message, 'x-flespi-message-index', {
                  value: index,
                  enumerable: false
                })
                result.push(message)
              }
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
      },
      telemetry: (state) => state.telemetry
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
      // if no devices are selected - map fills all screen height
      if (!this.activeDevices.length) { return value }
      // if nore than one device is selected - there is panel with devices' names tabs
      if (this.params.needShowPlayer) {
        value = 'calc(100% - 48px)'
      }
      return value
    }
  },
  methods: {
    initMap () {
      if (!this.map) {
        let osm = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { minZoom: 3, noWrap: true })
        this.map = L.map('map', {
          center: [51.50853, -0.12574],
          zoom: 3,
          maxBounds: [
            [90, -180],
            [-90, 180]
          ],
          layers: [osm]
        })
        this.map.addEventListener('zoom', e => {
          if (!e.flyTo) {
            this.flyToZoom = e.target.getZoom()
          }
        })
        this.map.addEventListener('click', this.mapClickHandler)
        let satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { minZoom: 3, noWrap: true, attribution: '© ArcGIS' })
        let opentopo = L.tileLayer('//{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { minZoom: 3, maxZoom: 19, attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)', noWrap: true})
        let osmtransp = L.tileLayer.wms('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          layers: 'semitransparent',
          transparent: 'true',
          format: 'image/png',
          maxZoom: 21,
          opacity: 0.5
        })
        var baseMaps = {
          'OpenStreetMap': osm,
          'Satellite': satellite,
          'OpenTopoMap': opentopo
        }
        L.control.layers(baseMaps, { 'OpenStreetMaps (0.5)': osmtransp }).addTo(this.map)
        L.control.polylineMeasure({
          position: 'topleft',
          showBearings: false,
          clearMeasurementsOnStop: false,
          showUnitControl: false,
          showClearControl: true,
          measureControlTitleOn: 'Turn on ruler',
          measureControlTitleOff: 'Turn off ruler',
          tooltipTextFinish: 'Click to <b>finish line</b><br>',
          tooltipTextDelete: 'Press SHIFT-key and click to <b>delete point</b>',
          tooltipTextMove: 'Click and drag to <b>move point</b><br>',
          tooltipTextResume: '<br>Press CTRL-key and click to <b>resume line</b>',
          tooltipTextAdd: 'Press CTRL-key and click to <b>add point</b>'
        }).addTo(this.map)
      }
    },
    flyToWithHideTracks (position, zoom) {
      const disabledLayout = []
      let isFlying = false
      this.map.once('zoomstart', e => {
        this.isFlying = true
        const fromZoom = e.target._zoom
        if (fromZoom !== zoom) {
          isFlying = true
          Object.keys(this.tracks).forEach((trackId) => {
            const track = this.tracks[trackId]
            if (track instanceof L.Polyline) {
              if (track.tail && track.tail instanceof L.Polyline && this.map.hasLayer(track.tail)) {
                this.map.removeLayer(track.tail)
                disabledLayout.push(track.tail)
              }
              if (track.overview && track.overview instanceof L.Polyline && this.map.hasLayer(track.overview)) {
                this.map.removeLayer(track.overview)
                disabledLayout.push(track.overview)
              }
              if (track.overview && this.map.hasLayer(track.overview)) {
                this.map.removeLayer(track)
                disabledLayout.push(track)
              }
            }
          })
        }
      })
      this.map.once('zoomend', e => {
        this.isFlying = false
        if (isFlying) {
          disabledLayout.forEach((layer) => {
            this.map.addLayer(layer)
          })
        }
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
        currentColor = this.tracks[id] && this.tracks[id].options ? this.tracks[id].options.color : this.markers[id] ? this.markers[id].color : this.devicesColors[id]
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
        if (this.messages[id] && this.messages[id].length && this.selectedDeviceId === parseInt(id)) {
          // selected logic
        }
      })
      this.markers[id].addEventListener('click', e => {
        this.telemetryDeviceId = parseInt(id)
        this.$emit('update-telemetry-device-id', this.telemetryDeviceId)
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
      if (currentPos && currentPos.length) {
        this.flyToWithHideTracks(currentPos, this.flyToZoom)
      } else {
        this.$q.notify({
          message: 'No Position!',
          color: 'warning',
          timeout: this.params.needShowMessages ? 500 : 2000
        })
      }
    },
    centerOnDevice (id, zoom) {
      const devicesById = this.activeDevices.filter(device => device.id === id),
        currentDevice = devicesById.length ? devicesById[0] : null
      let currentPos = currentDevice && []
      if (this.messages[id] && this.messages[id].length) {
        currentPos = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
      }
      if (currentPos.length) {
        this.map.setView(currentPos, zoom ? zoom : 14, { animation: false })
      } else {
        this.$q.notify({
          message: 'No Position!',
          color: 'warning',
          timeout: this.params.needShowMessages ? 500 : 2000
        })
      }
    },
    generateFlag (props) {
      let { id, status } = props || {}
      let color = id ? this.devicesColors[id] : '#e53935',
        icon = 'map-marker-star-outline'
      if (status === 'start') {
        color = colors.getBrand('primary')
        icon = 'map-marker-outline'
      } else if (status === 'stop') {
        color = colors.getBrand('positive')
        icon = 'map-marker-check'
      }
      return L.divIcon({
        className: `my-flag-icon flag-${status}-${id}`,
        iconSize: new L.Point(35, 35),
        html: `<i aria-hidden="true" style="color: ${color};" class="my-flag-icon__inner mdi mdi-${icon}"></i>`
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
          try {
            /* try to init device by telemetry */
            this.devicesState[id].telemetryAccess = true
            await this.$store.dispatch('getInitDataByDeviceId', [id, this.params.needShowInvalidPositionMessages])
          } catch (err) {
            if (err.response && err.response.status && err.response.status === 403) {
              this.devicesState[id].telemetryAccess = false
            }
          }
        }
        /* device initialization is completed - device is initialized either from messages or from telemetry */
        this.devicesState[id].initStatus = true
        /* check if device doesn't have access neither to messages, nor to telemetry, and mark it with property */
        if (this.devicesState[id].messagesAccess === false && this.devicesState[id].telemetryAccess === false) {
          /* find device and mark it with a special propery */
          const device = this.activeDevices.filter(device => device.id === id)[0]
          Object.defineProperty(device, 'x-flespi-no-access', {
            value: true,
            enumerable: false
          })
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
      Vue.connector.socket.on('offline', () => { this.$store.commit(`messages/${id}/setOffline`) })
      Vue.connector.socket.on('connect', () => {
        if (this.$store.state.messages[id].offline) {
          this.$store.commit(`messages/${id}/setReconnected`)
          this.$store.dispatch(`messages/${id}/getMissedMessages`)
        }
      })
      if (id === this.selectedDeviceId && this.devicesState[id].initStatus === true) {
        this.telemetryDeviceId = parseInt(id)
        this.$emit('update-telemetry-device-id', this.telemetryDeviceId)
        this.centerOnDevice(id)
      }
      this.$q.loading.hide()
    },
    viewOnMapHandler (content) {
      if (content['position.latitude'] && content['position.longitude']) {
        const position = [content['position.latitude'], content['position.longitude']],
          currentZoom = this.map.getZoom()
        if (this.map.messagePoint) { this.map.messagePoint.remove() }
        this.map.messagePoint = L.marker(position, {
          icon: L.divIcon({
            className: `my-round-marker-wrapper`,
            iconSize: new L.Point(10, 10),
            html: `<div class="my-round-marker"></div>`
          })
        })
        this.map.messagePoint.addTo(this.map)
        this.map.setView(position, currentZoom > 12 ? currentZoom : 12, { animation: false })
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
          this.tracks[id].tail.addEventListener('click', (e) => this.showMessageByTrackClick(e, id, this.tracks[id].tail))
          return true
        }
        if (this.player.tailInterval) { clearTimeout(this.player.tailInterval) }
        this.player.tailInterval = setTimeout(() => { this.tracks[id].tail && this.tracks[id].tail.setLatLngs(tail) }, ((renderDuration * 700) / this.player.speed))
      }
    },
    playerTimePlay ({ id }) {
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
        this.tracks[id].remove()
        this.player.status = 'play'
      }
    },
    playerTimeStop ({ id }) {
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
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
      }
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
      const latlngs = this.messages[id].map((message, index) => ({
        lat: message['position.latitude'],
        lng: message['position.longitude'],
        dir: message['position.direction'],
        index
      }))
      if (latlngs.length < 2) {
        this.tracks[id].addTo(this.map)
        this.player.status = 'stop'
        this.player.currentMsgIndex = null
        return
      }
      const line = L.polyline(latlngs, { snakingSpeed: 20 * this.player.speed, color: this.tracks[id].options.color })
      this.tracks[id].overview = line
      this.tracks[id].overview.addEventListener('click', (e) => this.showMessageByTrackClick(e, id, this.tracks[id].overview))
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
        this.tracks[id].addEventListener('click', (e) => this.showMessageByTrackClick(e, id, this.tracks[id]))
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
      this.$emit('update-color', id, color)
    },
    updateDeviceColorOnMap (id, color) {
      if (!this.tracks[id] || !(this.tracks[id] instanceof L.Polyline) ||
          !this.markers[id] || !(this.markers[id] instanceof L.Marker)) {
        return false
      }
      this.tracks[id].setStyle({ color })
      this.tracks[id].tail && this.tracks[id].tail.setStyle({ color })
      this.tracks[id].overview && this.tracks[id].overview.setStyle({ color })
      this.markers[id].color = color
      this.markers[id].setIcon(this.generateIcon(id, this.markers[id].options.title, color))
      if (this.messages[id][this.messages[id].length - 1]['position.direction']) {
        /* restore marker's direction, if known */
        this.updateMarkerDirection(id, this.messages[id][this.messages[id].length - 1]['position.direction'])
      }
    },
    registerModule (id) {
      this.devicesState[id] = { messagesAccess: true }
      this.$store.registerModule(
        ['messages', id],
        devicesMessagesModule({
          Vue,
          LocalStorage: this.$q.localStorage,
          name: { name: 'messages', lsNamespace: `${this.$store.state.storeName}.cols` },
          errorHandler: (err) => {
            if (err.response && err.response.status && err.response.status === 403) {
              this.devicesState[id].messagesAccess = false
            } else {
              this.$store.commit('reqFailed', err)
            }
          }
        }))
    },
    showMessageByTrackClick (e, id, track) {
      e.originalEvent.view.L.DomEvent.stopPropagation(e)
      const messages = this.messages[id]
      const position = L.GeometryUtil.closest(this.map, track, e.latlng)
      const indexes = messages.reduce((res, message, index) => {
        const lat = message['position.latitude']
        const lng = message['position.longitude']
        const nextMessage = messages[index + 1]
        if (!nextMessage) { return res }
        const nextLat = nextMessage['position.latitude']
        const nextLng = nextMessage['position.longitude']
        const isPosBetweenLat = (lat >= position.lat && nextLat <= position.lat) || (lat <= position.lat && nextLat >= position.lat)
        const isPosBetweenLng = (lng >= position.lng && nextLng <= position.lng) || (lng <= position.lng && nextLng >= position.lng)
        if (isPosBetweenLat && isPosBetweenLng) {
          const distance = L.GeometryUtil.distance(this.map, position, {lat, lng})
          const nextDistance = L.GeometryUtil.distance(this.map, position, {lat: nextLat, lng: nextLng})
          const closestMessageIndex = distance > nextDistance ? index + 1 : index
          res.push(closestMessageIndex)
        }
        return res
      }, [])
      const lastMessage = messages[indexes.slice(-1)[0]] || {}
      this.viewOnMapHandler(lastMessage)
      this.$store.commit(`messages/${id}/setSelected`, indexes)
    },
    mapClickHandler (e) {
      if (this.map.messagePoint) { this.map.messagePoint.remove() }
      this.activeDevicesID.forEach((id) => {
        this.$store.commit(`messages/${id}/clearSelected`)
      })
    },

    updateOrInitDevice (id) {
      /* this method is triggered by watch messages - "messages" object in the state has changed  */

      if (!this.messages[id] || !this.messages[id].length) {
        /* device has not messages, this my happen because initialization is not yet completed in getDeviceData */
        if (!this.markers[id]) {
          /* however we already need to create marker for the device, if not yet created */
          /* this is needed for Queue component to know the current color of the device for color-view div (color picker button) */
          this.markers[id] = {}
          this.markers[id].id = id
          this.markers[id].color = this.devicesColors[id]
          this.tracks[id] = {}
        }
        return false
      }

      /* now device has messages, either normal flespi messages, or synthetic 'x-flespi-inited-by-telemetry' message */

      if (!(this.markers[id] instanceof L.Marker) && !(this.tracks[id] instanceof L.Polyline)) {
        /* the marker and trackof the device are not yet initialized as leaftet instances */
        /* we've received messages and now it's time to init the marker and attach it to the map */
        const name = this.activeDevices.filter(device => device.id === parseInt(id))[0].name || `#${id}`,
          position = [this.messages[id][this.messages[id].length - 1]['position.latitude'], this.messages[id][this.messages[id].length - 1]['position.longitude']]
        this.initMarker(id, name, position)
        /* init track */
        this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), { weight: 4, color: this.markers[id] ? this.markers[id].color : this.getColorById(id) }).addTo(this.map)
        this.tracks[id].addEventListener('click', (e) => this.showMessageByTrackClick(e, id, this.tracks[id]))

        if (Number.parseInt(id) === this.selected) { // here typeof id is string
          if (this.messages[id].length > 1) {
            /* device has a bunch of messages - initially show the whole track on map */
            const bounding = this.tracks[id].getBounds()
            this.map.fitBounds(bounding)
          } else {
            /* device has only one message - initially show only device in comfortable zoom */
            this.map.setView(position, 14, { animation: false })
          }
        }
      }

      /* now update device on map according to the newly received message */
      if (!this.devicesState[id].messagesAccess) {
        /* this device has no access to messages, nothing more to do here for this device */
        return false
      }

      const currentArrPos = this.getLatLngArrByDevice(id)
      if (this.isSelectedDeviceFollowed) {
        const markerWatchedPos = this.selectedDeviceId && this.selectedDeviceId == id && this.markers[this.selectedDeviceId] && this.markers[this.selectedDeviceId] instanceof L.Marker ? this.markers[this.selectedDeviceId].getLatLng() : {},
          isWatchedPosChanged = this.selectedDeviceId && this.messages[this.selectedDeviceId] && this.messages[this.selectedDeviceId].length &&
            markerWatchedPos.lat && markerWatchedPos.lat !== this.messages[this.selectedDeviceId][this.messages[this.selectedDeviceId].length - 1]['position.latitude'] &&
            markerWatchedPos.lng && markerWatchedPos.lng !== this.messages[this.selectedDeviceId][this.messages[this.selectedDeviceId].length - 1]['position.longitude']
        if (isWatchedPosChanged) {
          const position = currentArrPos[currentArrPos.length - 1]
          position && this.centerOnDevice(this.selectedDeviceId, this.map.getZoom())
        }
      }
      /* if positions are empty clear marker and line */
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
      } else {
        /* update marker and track with newly recevied position */
        this.markers[id].setLatLng(currentArrPos[currentArrPos.length - 1]).update()
        this.markers[id].accuracy.setRadius(this.getAccuracyParams(this.messages[id][this.messages[id].length - 1]).accuracy)
        this.markers[id].accuracy.setLatLng(currentArrPos[currentArrPos.length - 1])
        this.markers[id].setOpacity(1)
        this.tracks[id].setLatLngs(currentArrPos)
      }
    },
    updateStateByMessages (messages) {
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
      keyArr.forEach(id => this.updateOrInitDevice(id))
    },
    updateStateByTelemetry (telemetry) {
      /* this method is triggered by watch telemetry: telemetry has updated */
      /* update device on map, if this device has no messages and therefore should be drawn on map by telemetry */
      if (!Object.keys(telemetry.telemetry).length) {
        /* nothing to do if we have no telemetry parameters yet */
        return false
      }
      const id = telemetry.deviceId
      if (!this.devicesState[id].telemetryAccess) {
        /* this device either has access to messages or has no access to telemetry, it will be drawn on map by messages (if any), nothing to do with it here */
        return false
      }
      if (!this.messages || !this.messages[id] || !this.messages[id][0]) {
        /* messages are not here, either initialization is not yet completed or this device has never sent a message to flespi */
        /* each device must have at least one message, either normal or syntethic 'x-flespi-inited-by-telemetry' one */
        return false
      }
      if (this.messages[id].lenth > 1 || !this.messages[id][0]['x-flespi-inited-by-telemetry']) {
        /* this device has normal messages, it will be drawn on map by messages, nothing to do here */
        /* actually, this should never happen */
        return false
      }

      /* retrieve position from telemetry and validate it */
      const lat = Number.parseFloat(telemetry.telemetry['position.latitude'].value)
      const latTs = Number.parseFloat(telemetry.telemetry['position.latitude'].ts)
      const lon = Number.parseFloat(telemetry.telemetry['position.longitude'].value)
      const lonTs = Number.parseFloat(telemetry.telemetry['position.longitude'].ts)
      if (Math.round(latTs * 1000) !== Math.round(lonTs * 1000)) {
        /* check that lan and lon come correspond to the same point of time */
        /* server should update them cosistently, but still */
        console.error("Wrong telemetry")
        return false
      }

      if (!this.params.needShowInvalidPositionMessages) {
        /* check if position.valid=false parameter has the same timestamp as the latest position, and skip it */
        if (telemetry.telemetry['position.valid'] && telemetry.telemetry['position.valid'].value === false &&
            (Math.abs(Number.parseFloat(telemetry.telemetry['position.valid'].ts - latTs) < 0.1))) {
          return false
        }
      }

      /* we recevied new position from telemetry */
      /* update syntethic 'x-flespi-inited-by-telemetry' message with position from the new telemetry */
      this.messages[id][0]['position.latitude'] = lat
      this.messages[id][0]['position.longitude'] = lon
      this.messages[id][0]['timestamp'] = latTs

      /* add other position parameters if they have the same simestamp as lat&lon, otherwise - clean them up */
      const positionParams =      [ 'direction', 'speed',  'altitude', 'valid',    'satellites', 'hdop',   'pdop'   ]
      const positionParamsType =  [ 'number',    'number', 'number',   'boolean',  'number',     'number', 'number' ]

      for (let i = 0; i < positionParams.length; i++) {
        const paramName = 'position.' + positionParams[i]
        const paramType = positionParamsType[i]

        if (telemetry.telemetry[paramName] && (Math.abs(Number.parseFloat(telemetry.telemetry[paramName].ts) - latTs) < 0.1)) {
          switch(paramType) {
            case 'number': // why numbers are received as strings ?? : {"position.direction":{"value":"168","ts":"1724842304"}
              this.messages[id][0][paramName] = Number.parseFloat(telemetry.telemetry[paramName].value)
              break
            default:
              this.messages[id][0][paramName] = telemetry.telemetry[paramName].value
              break
          }
        } else {
          delete this.messages[id][0][paramName]
        }
      }

      /* store the last telemetry position to draw the tail on the map, up to 50 points */
      if (!this.devicesState[id].telemetryTail) {
        this.devicesState[id].telemetryTail = []
      } else if (this.devicesState[id].telemetryTail.length > 50) {
        this.devicesState[id].telemetryTail.shift()
      }
      this.devicesState[id].telemetryTail.push([lat, lon])

      /* update marker and track on the map */
      if (this.markers[id] instanceof L.Marker) {
        const direction = (telemetry.telemetry['position.direction'] && (Math.abs(Number.parseFloat(telemetry.telemetry['position.direction'].ts)) - latTs) < 0.1) ?
                          Number.parseInt(telemetry.telemetry['position.direction'].value) : 0
        this.updateMarkerDirection(id, direction)
        this.markers[id].setLatLng([lat, lon]).update()
      }
      if (this.tracks[id] instanceof L.Polyline) {
        this.tracks[id].setLatLngs(this.devicesState[id].telemetryTail)
      }
      if (this.isSelectedDeviceFollowed) {
        this.centerOnDevice(this.selectedDeviceId, this.map.getZoom())
      }
    }
  },
  watch: {
    messages: {
      deep: true,
      handler (messages) {
        this.debouncedUpdateStateByMessages(messages)
      }
    },
    telemetry: {
      deep: true,
      handler (telemetry) {
        if (this.devicesState[telemetry.deviceId] && this.devicesState[telemetry.deviceId].messagesAccess) {
          /* this device is positioned by messages, no need to draw its position by telemetry */
          return false
        }
        this.debouncedUpdateStateByTelemetry(telemetry)
      }
    },
    activeDevices (newVal) {
      const activeDevicesID = newVal.map((device) => device.id)
      const currentDevicesID = Object.keys(this.messages).map(id => parseInt(id)),
        modifyType = currentDevicesID.length > activeDevicesID.length ? 'remove' : 'add'
      activeDevicesID.forEach((id) => {
        if (!this.$store.state.messages[id]) {
          this.registerModule(id)
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
          removedDevicesID.forEach((id) => this.devicesState[id].initStatus = null)
          break
        }
        case 'add': {
          const addedDeviceID = activeDevicesID.filter(id => !currentDevicesID.includes(id))
          if (addedDeviceID) {
            addedDeviceID.forEach((id) => {
              this.devicesState[id].initStatus = false
              this.initDevice(id)
            })
          }
          break
        }
      }
      if (this.map && L.DomUtil.hasClass(this.map._container, 'crosshair-cursor-enabled')) {
        L.DomUtil.removeClass(this.map._container, 'crosshair-cursor-enabled')
      }
    },
    selectedDeviceId (id) {
      if (id && this.devicesState[id] && this.devicesState[id].initStatus === true) {
        this.flyToDevice(id)
      }
    },
    isSelectedDeviceFollowed (state) {
      if (state === true && this.devicesState[this.selectedDeviceId] && this.devicesState[this.selectedDeviceId].initStatus === true) {
        /* user enabled following the selected device on map */
        /* center on device, if device is already initialized */
        this.centerOnDevice(this.selectedDeviceId, this.map.getZoom())
      }
    },
    devicesColors: {
      deep: true,
      handler(newVal, oldVal){
        this.activeDevicesID.forEach(id => {
          if (newVal[id] !== oldVal[id]) {
            this.updateDeviceColorOnMap(id, newVal[id])
          }
        })
      },
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
    'params.needShowInvalidPositionMessages' : function () {
      this.activeDevicesID.forEach(async (id) => {
        // reinit device data, as now device may have last position from telemetry
        await this.getDeviceData(id)
        if (id === this.selectedDeviceId) {
          this.centerOnDevice(id)
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
      if (!this.isFlying && this.tracks[active] && this.tracks[active] instanceof L.Polyline) {
        const bounding = this.tracks[active].getBounds()
        this.map.fitBounds(bounding)
      }
      if (this.devicesState[active] && this.devicesState[active].telemetryTail && this.devicesState[active].telemetryTail.length > 0) {
        /* wwhen selected device has changed, discard previous telemetry tail, if any so that to start drawing tail from the scratch */
        this.devicesState[active].telemetryTail = []
      }
    }
  },
  created () {
    this.debouncedUpdateStateByMessages = debounce(this.updateStateByMessages, 100)
    this.debouncedUpdateStateByTelemetry = debounce(this.updateStateByTelemetry, 5)
    this.activeDevicesID = this.activeDevices.map((device) => device.id)
    this.activeDevicesID.forEach((id) => {
      this.registerModule(id)
      this.$store.commit(`messages/${id}/setSortBy`, 'timestamp')
      this.devicesState[id].initStatus = false
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
  .leaflet-control-layers
    top 110px
    .leaflet-control-layers-toggle
      width 24px
      height 24px
      background-size 20px
  .leaflet-container.crosshair-cursor-enabled
    cursor crosshair
  .leaflet-control.leaflet-bar
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
  .my-round-marker
    height 10px
    border-radius 50%
    background-color $red-7
    transform scale(1)
    box-shadow 0 0 0 0 rgba(255, 82, 82, 1)
    animation pulse 2s infinite

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(255, 82, 82, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
    }
  }
</style>
