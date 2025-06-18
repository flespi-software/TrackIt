<template>
  <div class="map-wrapper absolute-top-left absolute-bottom-right">
    <div id="map" :style="{ height: mapHeight }">
      <q-resize-observer @resize="onResize" />
    </div>
    <queue
      :needShowMessages="params.needShowMessages"
      :needShowPlayer="params.needShowPlayer"
      :player="player"
      :selectedDeviceId="selectedDeviceId"
      @change-need-show-messages="
        (flag) => {
          $emit('change-need-show-messages', flag)
        }
      "
      @player-pause="(data) => playProcess(data, 'pause')"
      @player-play="(data) => playProcess(data, 'play')"
      @player-stop="(data) => playProcess(data, 'stop')"
      @player-mode="playerModeChange"
      @player-speed="playerSpeedChangeHandler"
      @player-value="(data) => playProcess(data, 'value')"
      @view-on-map="viewOnMapHandler"
    />
    <color-modal ref="colorModal" v-model="colorModel" />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions, mapState } from 'pinia'
import { getCssVar, debounce } from 'quasar'
import { useDevicesStore } from '../stores/devices'
import { useTelemetryStore } from 'src/stores/telemetry'
import { useAuthStore } from '../stores/auth'
import { useMiscStore } from 'src/stores/misc'
import Queue from './Queue.vue'
import ColorModal from './ColorModal.vue'
import * as L from 'leaflet'
import 'leaflet-geometryutil'
import 'leaflet/dist/leaflet.css'
import 'leaflet.marker.slideto'
import 'leaflet.polylinemeasure/Leaflet.PolylineMeasure.css'
import 'leaflet.polylinemeasure/Leaflet.PolylineMeasure'
import lefleatSnake from '../assets/lefleat-snake'
import getIconHTML from '../assets/getIconHTML.js'

lefleatSnake(L)

export default defineComponent({
  name: 'MapContainer',
  components: {
    ColorModal,
    Queue,
  },
  emits: ['change-need-show-messages', 'update-telemetry-device-id'],
  props: ['activeDevices', 'isSelectedDeviceFollowed', 'params', 'selectedDeviceId'],
  data() {
    return {
      activeDevicesIDs: [], // list of ID of active devices
      colorDeviceId: 0, // ID of the device for which color modal is opened
      colorModel: '#fff', // color of the device for which color modal is opened, model value of the ColorModal component
      devicesStates: {},
      mapFlyToZoom: 15,
      mapIsFlying: null,
      messagesStores: {}, // devices' messages stores
      player: {
        currentMsgIndex: null,
        mode: 'time',
        tailInterval: 0,
        speed: 10,
        status: 'stop',
      },
    }
  },
  computed: {
    ...mapState(useAuthStore, {
      socketConnected: (store) => store.socketConnected,
    }),
    ...mapState(useDevicesStore, {
      devicesColors: (store) => store.devicesColors,
    }),
    ...mapState(useMiscStore, {
      date: (store) => store.date,
    }),
    ...mapState(useTelemetryStore, {
      telemetry: (store) => store.telemetry,
      telemetryKeys: (store) => store.telemetryKeys,
    }),
    mapHeight() {
      let value = '100%'
      // if no devices are selected - map fills all screen height
      if (!this.activeDevices.length) {
        return value
      }
      // if nore than one device is selected - there is panel with devices' names tabs
      if (this.params.needShowPlayer) {
        value = 'calc(100% - 48px)'
      }
      return value
    },
    messages() {
      return this.activeDevicesIDs.reduce((result, id) => {
        result[id] = this.messagesStores[id].messages.reduce((result, message, index) => {
          if (!!message['position.latitude'] && !!message['position.longitude']) {
            /* pass message to the map only if it has position.latitude and position.longitude */
            if (!this.params.needShowInvalidPositionMessages) {
              /* don't pass messages with position.valid=false to the map */
              if (
                !message['position.valid'] ||
                (message['position.valid'] && message['position.valid'] === true)
              ) {
                result.push(message)
              }
            } else {
              /* pass messages to the map disregarding pasition.valid parameter */
              result.push(message)
            }
          }
          return result
        }, [])
        return result
      }, {})
    },
  },
  methods: {
    ...mapActions(useDevicesStore, ['getInitDataByDeviceId', 'updateDeviceColor']),
    ...mapActions(useMiscStore, ['getMessagesStore']),
    addFlags(id) {
      if (!this.markers[id]) {
        return false
      }
      if (!this.markers[id].flags) {
        this.markers[id].flags = {
          start: {},
          stop: {},
        }
      }
      if (this.messages[id].length) {
        const startPosition = [
            this.messages[id][0]['position.latitude'],
            this.messages[id][0]['position.longitude'],
          ],
          stopPosition = [
            this.messages[id][this.messages[id].length - 1]['position.latitude'],
            this.messages[id][this.messages[id].length - 1]['position.longitude'],
          ]
        this.markers[id].flags.start = L.marker(startPosition, {
          icon: this.generateFlag({ id, status: 'start' }),
        })
        this.markers[id].flags.start.addTo(this.map)
        this.markers[id].flags.stop = L.marker(stopPosition, {
          icon: this.generateFlag({ id, status: 'stop' }),
        })
        const needStopFlag = this.messages[id].timestampTo <= Date.now()
        needStopFlag && this.markers[id].flags.stop.addTo(this.map)
      }
    },
    centerOnDevice(id, zoom) {
      let currentPos = useDevicesStore().getDeviceById(id) && []
      if (!currentPos) {
        return
      }
      if (this.messages[id] && this.messages[id].length) {
        currentPos = [
          this.messages[id][this.messages[id].length - 1]['position.latitude'],
          this.messages[id][this.messages[id].length - 1]['position.longitude'],
        ]
      }
      if (currentPos.length) {
        this.map.setView(currentPos, zoom ? zoom : 14, { animation: false })
      } else {
        this.$q.notify({
          message: 'No Position!',
          color: 'warning',
          timeout: this.params.needShowMessages ? 500 : 2000,
        })
      }
    },
    flyToDevice(id) {
      let currentPos = useDevicesStore().getDeviceById(id) && []
      if (!currentPos) {
        return
      }
      if (this.messages[id] && this.messages[id].length) {
        currentPos = [
          this.messages[id][this.messages[id].length - 1]['position.latitude'],
          this.messages[id][this.messages[id].length - 1]['position.longitude'],
        ]
      }
      if (currentPos.length) {
        this.flyToWithHideTracks(currentPos, this.mapFlyToZoom)
      } else {
        this.$q.notify({
          message: 'No Position!',
          color: 'warning',
          timeout: this.params.needShowMessages ? 500 : 2000,
        })
      }
    },
    flyToWithHideTracks(position, zoom) {
      const disabledLayout = []
      let isFlying = false
      this.map.once('zoomstart', (e) => {
        this.mapIsFlying = true
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
              if (
                track.overview &&
                track.overview instanceof L.Polyline &&
                this.map.hasLayer(track.overview)
              ) {
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
      this.map.once('zoomend', (e) => {
        this.mapIsFlying = false
        if (isFlying) {
          disabledLayout.forEach((layer) => {
            this.map.addLayer(layer)
          })
        }
      })

      this.map.flyTo(position, zoom)
    },
    generateFlag(props) {
      let { id, status } = props || {}
      let color = id && this.devicesColors[id] ? this.devicesColors[id] : '#e53935',
        icon = 'mdi-map-marker-star-outline'
      if (status === 'start') {
        color = getCssVar('primary')
        icon = 'mdi-map-marker-outline'
      } else if (status === 'stop') {
        color = getCssVar('positive')
        icon = 'mdi-map-marker-check'
      }
      return L.divIcon({
        className: `my-flag-icon flag-${status}-${id}`,
        iconSize: new L.Point(35, 35),
        html: `<i aria-hidden="true" style="color: ${color};" class="my-flag-icon__inner mdi ${icon}"></i>`,
      })
    },
    generateIcon(id, name, color) {
      return L.divIcon({
        className: `my-div-icon icon-${id}`,
        iconSize: new L.Point(20, 35),
        html: getIconHTML(name, color, this.params.needShowNamesOnMap),
      })
    },
    getAccuracyParams(message) {
      const position = [message['position.latitude'], message['position.longitude']],
        accuracy = message['position.hdop'] || message['position.pdop'] || 0,
        circleStyle = {
          stroke: true,
          color: '#444',
          weight: 3,
          opacity: 0.5,
          fillOpacity: 0.15,
          fillColor: '#444',
          clickable: false,
        }
      return { position, accuracy, circleStyle }
    },
    async getDeviceData(id) {
      if (!id) {
        return
      }
      const deviceMessagesStore = this.messagesStores[id]
      if (deviceMessagesStore.realtimeEnabled) {
        await deviceMessagesStore.unsubscribePooling()
      }
      deviceMessagesStore.clearMessages()
      const from = this.date[0]
      const to = this.date[1]
      deviceMessagesStore.setTimestampFrom(from)
      deviceMessagesStore.setTimestampTo(to)
      await deviceMessagesStore.get()
      if (to > Date.now()) {
        const render = await deviceMessagesStore.pollingGet()
        render()
      }
      this.addFlags(id)
      if (!deviceMessagesStore.messages.length) {
        try {
          /* try to init device by telemetry */
          this.devicesStates[id].telemetryAccess = true
          await this.getInitDataByDeviceId([id, this.params.needShowInvalidPositionMessages])
        } catch (err) {
          if (err.response && err.response.status && err.response.status === 403) {
            this.devicesStates[id].telemetryAccess = false
          }
        }
      }
      /* device initialization is completed - device is initialized either from messages or from telemetry */
      this.devicesStates[id].initStatus = true
      /* if device doesn't have access to messages mark it with corresponding property */
      if (this.devicesStates[id].messagesAccess === false) {
        const device = useDevicesStore().getDeviceById(id)
        Object.defineProperty(
          device,
          this.devicesStates[id].telemetryAccess === false
            ? 'x-flespi-no-access'
            : 'x-flespi-telemetry-access',
          {
            value: true,
            enumerable: false,
          },
        )
      }
    },
    getLatLngArrByDevice(id) {
      if (!this.messages[id]) {
        return []
      }
      return this.messages[id].reduce((acc, message) => {
        acc.push([message['position.latitude'], message['position.longitude']])
        return acc
      }, [])
    },
    async initDevice(id) {
      if (!id) {
        return
      }
      this.$q.loading.show()
      const deviceMessagesStore = this.messagesStores[id]
      await deviceMessagesStore.getCols({ actions: true, etc: true })
      await this.getDeviceData(id)
      this.$connector.socket.on('offline', () => {
        deviceMessagesStore.setOffline()
      })
      this.$connector.socket.on('connect', () => {
        if (deviceMessagesStore.offline) {
          deviceMessagesStore.setReconnected()
          deviceMessagesStore.getMissedMessages()
        }
      })
      if (id === this.selectedDeviceId && this.devicesStates[id].initStatus === true) {
        this.$emit('update-telemetry-device-id', parseInt(id))
        this.centerOnDevice(id)
      }
      this.$q.loading.hide()
    },
    initMarker(id, name, position) {
      const direction = this.messages[id][this.messages[id].length - 1]['position.direction']
          ? this.messages[id][this.messages[id].length - 1]['position.direction']
          : 0,
        currentColor =
          this.tracks[id] && this.tracks[id].options
            ? this.tracks[id].options.color
            : this.markers[id]
              ? this.markers[id].color
              : this.devicesColors[id]
      this.markers[id] = L.marker(position, {
        icon: this.generateIcon(id, name, currentColor),
        draggable: false,
        title: name,
      })
      this.markers[id].id = id
      this.markers[id].color = currentColor
      const {
        position: pos,
        accuracy,
        circleStyle,
      } = this.getAccuracyParams(this.messages[id][this.messages[id].length - 1])
      this.markers[id].accuracy = L.circle(pos, accuracy, circleStyle)
      this.markers[id].accuracy.addTo(this.map)
      this.markers[id].addEventListener('add', (e) => {
        this.updateMarkerDirection(id, direction)
        if (
          this.messages[id] &&
          this.messages[id].length &&
          this.selectedDeviceId === parseInt(id)
        ) {
          // selected logic
        }
      })
      this.markers[id].addEventListener('click', (e) => {
        this.$emit('update-telemetry-device-id', parseInt(id))
      })
      this.markers[id].addEventListener('move', (e) => {
        if (this.player.status === 'stop') {
          this.updateMarkerDirection(
            id,
            this.messages[id][this.messages[id].length - 1]['position.direction'],
          )
        }
      })
      this.markers[id].addEventListener('contextmenu', (e) => {
        /* right click on the car on map */
        /* store device id for future update of the device color in the store */
        this.colorDeviceId = id
        /* fetch color model of the current device from the store */
        this.colorModel = this.devicesColors[id] || '#909090'
        /* display color modal with colorModel as model value */
        this.$refs.colorModal.show()
      })
      this.markers[id].addTo(this.map)
    },
    initMessagesStoreForDevice(id) {
      if (!this.messagesStores[id]) {
        this.messagesStores[id] = this.getMessagesStore(id, (err, deviceId) => {
          if (err.response && err.response.status && err.response.status === 403) {
            /* this device doesn't have access to messages */
            this.devicesStates[deviceId].messagesAccess = false
          }
        })
        this.messagesStores[id].setSortBy('timestamp')
        this.messagesStores[id].setLimit(0)
        /* init device statuses - device is not yet init and by default we assume that it has access to messages */
        if (!this.devicesStates[id]) {
          this.devicesStates[id] = {
            messagesAccess: true,
            initStatus: false,
          }
          return
        }
        this.devicesStates[id].messagesAccess = true
        this.devicesStates[id].initStatus = false
      }
    },
    initMap() {
      if (!this.map) {
        let osm = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          minZoom: 2,
          maxZoom: 19,
          noWrap: true,
        })
        this.map = L.map('map', {
          center: [51.50853, -0.12574],
          zoom: 3,
          maxBounds: [
            [90, -180],
            [-90, 180],
          ],
          layers: [osm],
        })
        this.map.addEventListener('zoom', (e) => {
          if (!e.flyTo) {
            this.mapFlyToZoom = e.target.getZoom()
          }
        })
        this.map.addEventListener('click', this.mapClickHandler)
        let satellite = L.tileLayer(
          '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { minZoom: 2, maxZoom: 19, noWrap: true, attribution: '© ArcGIS' },
        )
        let opentopo = L.tileLayer('//{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          minZoom: 2,
          maxZoom: 16,
          attribution:
            'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
          noWrap: true,
        })
        let osmtransp = L.tileLayer.wms('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          layers: 'semitransparent',
          transparent: 'true',
          format: 'image/png',
          maxZoom: 19,
          opacity: 0.5,
        })
        var baseMaps = {
          OpenStreetMap: osm,
          Satellite: satellite,
          OpenTopoMap: opentopo,
        }
        L.control.layers(baseMaps, { 'OpenStreetMaps (0.5)': osmtransp }).addTo(this.map)
        L.control
          .polylineMeasure({
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
            tooltipTextAdd: 'Press CTRL-key and click to <b>add point</b>',
          })
          .addTo(this.map)
      }
    },
    mapClickHandler(e) {
      if (this.map.messagePoint) {
        this.map.messagePoint.remove()
      }
      this.activeDevicesIDs.forEach((id) => {
        this.messagesStores[id].clearSelected()
      })
    },
    onResize() {
      if (this.map) {
        this.map.invalidateSize()
      }
    },
    playerDataPause({ id }) {
      if (this.player.status === 'stop') {
        return
      }
      this.player.status = 'pause'
      this.tracks[id].overview.snakePause()
    },
    playerDataPlay({ id }) {
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
        index,
      }))
      if (latlngs.length < 2) {
        this.tracks[id].addTo(this.map)
        this.player.status = 'stop'
        this.player.currentMsgIndex = null
        return
      }
      this.map.setView([latlngs[0].lat, latlngs[0].lng], this.map.getZoom(), { animation: false })
      const line = L.polyline(latlngs, {
        snakingSpeed: 20 * this.player.speed,
        color: this.tracks[id].options.color,
      })
      this.tracks[id].overview = line
      this.tracks[id].overview.addEventListener('click', (e) =>
        this.showMessageByTrackClick(e, id, this.tracks[id].overview),
      )
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
    playerDataStop({ id }) {
      this.player.status = 'stop'
      if (this.tracks[id].overview) {
        this.tracks[id].overview.remove()
        delete this.tracks[id].overview
      }
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
        this.tracks[id].addTo(this.map)
        this.tracks[id].addEventListener('click', (e) =>
          this.showMessageByTrackClick(e, id, this.tracks[id]),
        )
      }
      const message = this.messages[id].slice(-1)[0]
      this.player.currentMsgIndex = null
      if (message) {
        const lastPos = [message['position.latitude'], message['position.longitude']]
        this.updateMarker(id, lastPos, message['position.direction'])
      }
    },
    playerDataValue({ id }) {},
    playerModeChange({ id, mode }) {
      if (this.player.status !== 'stop') {
        if (mode === 'data') {
          this.playerTimeStop({ id })
        } else {
          this.playerDataStop({ id })
        }
      }
      this.player.mode = mode
    },
    playerSpeedChangeHandler({ speed, id }) {
      this.player.speed = speed
      if (this.player.mode === 'data' && this.player.status !== 'stop') {
        this.tracks[id].overview.setStyle({ snakingSpeed: 20 * speed })
      }
    },
    playProcess(data, type) {
      const mode = this.player.mode === 'data' ? 0 : 1
      switch (type) {
        case 'value': {
          mode ? this.playerTimeValue(data) : this.playerDataValue(data)
          break
        }
        case 'play': {
          if (this.player.status === 'play') {
            return
          }
          mode ? this.playerTimePlay(data) : this.playerDataPlay(data)
          break
        }
        case 'stop': {
          if (this.player.status === 'stop') {
            return
          }
          mode ? this.playerTimeStop(data) : this.playerDataStop(data)
          break
        }
        case 'pause': {
          if (this.player.status === 'pause') {
            return
          }
          mode ? this.playerTimePause(data) : this.playerDataPause(data)
          break
        }
      }
    },
    playerTimePause({ id }) {
      this.player.status = 'pause'
    },
    playerTimePlay({ id }) {
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
        this.tracks[id].remove()
        this.player.status = 'play'
        this.map.setView(
          [this.messages[id][0]['position.latitude'], this.messages[id][0]['position.longitude']],
          this.map.getZoom(),
          { animation: false },
        )
      }
    },
    playerTimeStop({ id }) {
      if (this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
        if (this.tracks[id].tail) {
          this.tracks[id].tail.remove()
          delete this.tracks[id].tail
        }
        const realtimeEnabled = this.messagesStores[id].realtimeEnabled
        const msgIndex = realtimeEnabled ? this.messages[id].length - 1 : 0
        const message = this.messages[id][msgIndex]
        this.$nextTick(() => {
          this.player.currentMsgIndex = msgIndex ? null : 0
        })
        this.player.status = 'stop'
        this.tracks[id].addTo(this.map)
        const lastPos = [message['position.latitude'], message['position.longitude']]
        this.updateMarker(id, lastPos, message['position.direction'])
      }
    },
    playerTimeValue({ id, messagesIndexes }) {
      if (
        !this.messages[id] ||
        !messagesIndexes ||
        (this.player.status !== 'play' && this.player.status !== 'pause')
      ) {
        return false
      }
      let renderDuration = 0,
        lastMessageIndexWithPosition = null
      const endIndex = messagesIndexes[messagesIndexes.length - 1],
        startIndex = 0,
        tailMessages = this.messages[id].slice(startIndex, endIndex + 1),
        tail = tailMessages.reduce((tail, message, index) => {
          if (
            typeof message['position.latitude'] === 'number' &&
            typeof message['position.longitude'] === 'number'
          ) {
            lastMessageIndexWithPosition = index
            tail.push([message['position.latitude'], message['position.longitude']])
          }
          return tail
        }, [])
      messagesIndexes.forEach((messageIndex) => {
        if (this.markers[id] && this.markers[id] instanceof L.Marker) {
          const message = this.messages[id][messageIndex]
          const havePosition =
            message &&
            typeof message['position.latitude'] === 'number' &&
            typeof message['position.longitude'] === 'number'
          this.player.currentMsgIndex = messageIndex
          if (havePosition) {
            const pos = [message['position.latitude'], message['position.longitude']]
            if (this.player.status === 'play' && messagesIndexes[0] !== 0) {
              let duration = 1000 / this.player.speed / messagesIndexes.length
              if (messageIndex !== 0) {
                const prevTimestamp = this.messages[id][messageIndex - 1].timestamp,
                  currentTimestamp = message.timestamp,
                  durationInSeconds = currentTimestamp - prevTimestamp
                duration = (durationInSeconds * 1000) / this.player.speed
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
          this.tracks[id].tail.addEventListener('click', (e) =>
            this.showMessageByTrackClick(e, id, this.tracks[id].tail),
          )
          return true
        }
        if (this.player.tailInterval) {
          clearTimeout(this.player.tailInterval)
        }
        this.player.tailInterval = setTimeout(
          () => {
            this.tracks[id].tail && this.tracks[id].tail.setLatLngs(tail)
          },
          (renderDuration * 700) / this.player.speed,
        )
      }
    },
    removeFlags(id) {
      if (
        !this.markers[id] ||
        !this.markers[id].flags ||
        !(this.markers[id].flags.start instanceof L.Marker) ||
        !(this.markers[id].flags.stop instanceof L.Marker)
      ) {
        return false
      }
      this.markers[id].flags.start.remove()
      this.markers[id].flags.stop.remove()
      this.markers[id].flags = undefined
    },
    removeMarker(id) {
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
      delete this.markers[id]
      delete this.tracks[id]
    },
    showMessageByTrackClick(e, id, track) {
      e.originalEvent.view.L.DomEvent.stopPropagation(e)
      const messages = this.messages[id]
      const position = L.GeometryUtil.closest(this.map, track, e.latlng)
      const indexes = messages.reduce((res, message, index) => {
        const lat = message['position.latitude']
        const lng = message['position.longitude']
        const nextMessage = messages[index + 1]
        if (!nextMessage) {
          return res
        }
        const nextLat = nextMessage['position.latitude']
        const nextLng = nextMessage['position.longitude']
        const isPosBetweenLat =
          (lat >= position.lat && nextLat <= position.lat) ||
          (lat <= position.lat && nextLat >= position.lat)
        const isPosBetweenLng =
          (lng >= position.lng && nextLng <= position.lng) ||
          (lng <= position.lng && nextLng >= position.lng)
        if (isPosBetweenLat && isPosBetweenLng) {
          const distance = L.GeometryUtil.distance(this.map, position, { lat, lng })
          const nextDistance = L.GeometryUtil.distance(this.map, position, {
            lat: nextLat,
            lng: nextLng,
          })
          const closestMessageIndex = distance > nextDistance ? index + 1 : index
          res.push(closestMessageIndex)
        }
        return res
      }, [])
      const lastMessage = messages[indexes.slice(-1)[0]] || {}

      this.viewOnMapHandler(lastMessage)
      this.messagesStores[id].setSelected(indexes)
    },
    updateDeviceColorOnMap(id, color) {
      if (
        !this.tracks[id] ||
        !(this.tracks[id] instanceof L.Polyline) ||
        !this.markers[id] ||
        !(this.markers[id] instanceof L.Marker)
      ) {
        return false
      }
      this.tracks[id].setStyle({ color })
      this.tracks[id].tail && this.tracks[id].tail.setStyle({ color })
      this.tracks[id].overview && this.tracks[id].overview.setStyle({ color })
      this.markers[id].color = color
      this.markers[id].setIcon(this.generateIcon(id, this.markers[id].options.title, color))
      if (this.messages[id][this.messages[id].length - 1]['position.direction']) {
        /* restore marker's direction, if known */
        this.updateMarkerDirection(
          id,
          this.messages[id][this.messages[id].length - 1]['position.direction'],
        )
      }
    },
    updateMarker(id, pos, dir) {
      this.updateMarkerDirection(id, dir)
      this.markers[id].setLatLng(pos).update()
    },
    updateMarkerDirection(id, dir) {
      if (dir) {
        const element = document.querySelector(`.icon-${id} .my-div-icon__inner`)
        if (element) {
          element.style.transform = `rotate(${dir || 0}deg)`
        }
      }
    },
    updateOrInitDevice(id) {
      /* this method is triggered by watch messages - "messages" object in the state has changed  */

      if (!this.messages[id] || !this.messages[id].length) {
        /* device has not messages, this my happen because initialization is not yet completed in getDeviceData */
        if (!this.markers[id]) {
          /* however we already need to create marker for the device, if not yet created */
          /* this is needed for Queue component to know the current color of the device for color-view div (color picker button) */
          this.markers[id] = {}
          this.markers[id].id = id
          this.markers[id].color = this.devicesColors[id] || '#e53935'
          this.tracks[id] = {}
        }
        return false
      }

      /* now device has messages, either normal flespi messages, or synthetic 'x-flespi-inited-by-telemetry' message */

      if (!(this.markers[id] instanceof L.Marker) && !(this.tracks[id] instanceof L.Polyline)) {
        /* the marker and track of the device are not yet initialized as leaftet instances */
        /* we've received messages and now it's time to init the marker and attach it to the map */
        const name =
            this.activeDevices.filter((device) => device.id === parseInt(id))[0].name || `#${id}`,
          position = [
            this.messages[id][this.messages[id].length - 1]['position.latitude'],
            this.messages[id][this.messages[id].length - 1]['position.longitude'],
          ]
        this.initMarker(id, name, position)
        /* init track */
        this.tracks[id] = L.polyline(this.getLatLngArrByDevice(id), {
          weight: 4,
          color: this.markers[id] ? this.markers[id].color : this.getColorById(id),
        }).addTo(this.map)
        this.tracks[id].addEventListener('click', (e) =>
          this.showMessageByTrackClick(e, id, this.tracks[id]),
        )

        if (Number.parseInt(id) === this.selectedDeviceId) {
          // here typeof id is string
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
      if (!this.devicesStates[id].messagesAccess) {
        /* this device has no access to messages, nothing more to do here for this device */
        return false
      }

      const currentArrPos = this.getLatLngArrByDevice(id)
      if (this.selectedDeviceId && this.selectedDeviceId == id && this.isSelectedDeviceFollowed) {
        /* selected device is followed - check if we need to move map according to the new position */
        const currentPosFromMarker =
          this.markers[id] && this.markers[id] instanceof L.Marker
            ? this.markers[id].getLatLng()
            : {}
        const newPosFromMessage = {
          lat: this.messages[id][this.messages[id].length - 1]['position.latitude'],
          lng: this.messages[id][this.messages[id].length - 1]['position.longitude'],
        }
        if (
          currentPosFromMarker &&
          currentPosFromMarker.lat &&
          currentPosFromMarker.lng &&
          newPosFromMessage &&
          newPosFromMessage.lat &&
          newPosFromMessage.lng &&
          (currentPosFromMarker.lat !== newPosFromMessage.lat ||
            currentPosFromMarker.lng !== newPosFromMessage.lng)
        ) {
          /* position has changed - center on device */
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
          id: id,
        }
      } else {
        /* update marker and track with newly recevied position */
        this.markers[id].setLatLng(currentArrPos[currentArrPos.length - 1]).update()
        this.markers[id].accuracy.setRadius(
          this.getAccuracyParams(this.messages[id][this.messages[id].length - 1]).accuracy,
        )
        this.markers[id].accuracy.setLatLng(currentArrPos[currentArrPos.length - 1])
        this.markers[id].setOpacity(1)
        this.tracks[id].setLatLngs(currentArrPos)
      }
    },
    updateStateByMessages(messages) {
      if (this.player.status === 'play' || this.player.status === 'pause') {
        return false
      }
      const deviceIDs = Object.keys(messages),
        deviceIDsOnMap = Object.keys(this.markers)
      if (!deviceIDs.length) {
        deviceIDsOnMap.forEach((id) => {
          this.removeMarker(id)
        })
        return false
      }
      if (deviceIDs.length < deviceIDsOnMap.length) {
        const removeDeviceId = deviceIDsOnMap.filter((key) => !deviceIDs.includes(key))[0]
        this.removeMarker(removeDeviceId)
        return false
      }
      deviceIDs.forEach((id) => this.updateOrInitDevice(id))
    },
    updateStateByTelemetry(id) {
      /* this method is triggered by watch telemetry: telemetry has updated */
      /* update device on map, if this device has no messages and therefore should be drawn on map by telemetry */
      if (!this.telemetryKeys.length) {
        /* nothing to do if we have no telemetry parameters yet */
        return false
      }
      if (!this.devicesStates[id].telemetryAccess) {
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
      const lat = Number.parseFloat(this.telemetry['position.latitude'].value)
      const latTs = Number.parseFloat(this.telemetry['position.latitude'].ts)
      const lon = Number.parseFloat(this.telemetry['position.longitude'].value)
      const lonTs = Number.parseFloat(this.telemetry['position.longitude'].ts)
      if (Math.round(latTs * 1000) !== Math.round(lonTs * 1000)) {
        /* check that lan and lon come correspond to the same point of time */
        /* server should update them cosistently, but still */
        console.error('Wrong telemetry')
        return false
      }
      if (!this.params.needShowInvalidPositionMessages) {
        /* check if position.valid=false parameter has the same timestamp as the latest position, and skip it */
        if (
          this.telemetry['position.valid'] &&
          this.telemetry['position.valid'].value === false &&
          Math.abs(Number.parseFloat(this.telemetry['position.valid'].ts - latTs) < 0.1)
        ) {
          return false
        }
      }
      /* we recevied new position from telemetry */
      /* update syntethic 'x-flespi-inited-by-telemetry' message with position from the new telemetry */
      const newSyntethicMessage = {
        ident: this.messages[id][0].ident,
        'position.latitude': lat,
        'position.longitude': lon,
        timestamp: latTs,
      }
      /* add other position parameters if they have the same simestamp as lat&lon, otherwise - clean them up */
      const positionParams = [
        'direction',
        'speed',
        'altitude',
        'valid',
        'satellites',
        'hdop',
        'pdop',
      ]
      const positionParamsType = [
        'number',
        'number',
        'number',
        'boolean',
        'number',
        'number',
        'number',
      ]
      for (let i = 0; i < positionParams.length; i++) {
        const paramName = 'position.' + positionParams[i]
        const paramType = positionParamsType[i]
        if (
          this.telemetry[paramName] &&
          Math.abs(Number.parseFloat(this.telemetry[paramName].ts) - latTs) < 0.1
        ) {
          switch (paramType) {
            case 'number': // why numbers are received as strings ?? : {"position.direction":{"value":"168","ts":"1724842304"}
              newSyntethicMessage[paramName] = Number.parseFloat(this.telemetry[paramName].value)
              break
            default:
              newSyntethicMessage[paramName] = this.telemetry[paramName].value
              break
          }
        }
      }
      Object.defineProperty(newSyntethicMessage, 'x-flespi-inited-by-telemetry', {
        value: true,
        enumerable: false,
      })
      /* set new syntethic message to the store */
      this.messagesStores[id].setHistoryMessages([newSyntethicMessage])

      /* store the last telemetry position to draw the tail on the map, up to 50 points */
      if (!this.devicesStates[id].telemetryTail) {
        this.devicesStates[id].telemetryTail = []
      } else if (this.devicesStates[id].telemetryTail.length > 50) {
        this.devicesStates[id].telemetryTail.shift()
      }
      this.devicesStates[id].telemetryTail.push([lat, lon])

      /* update marker and track on the map */
      if (this.markers[id] instanceof L.Marker) {
        const direction =
          this.telemetry['position.direction'] &&
          Math.abs(Number.parseFloat(this.telemetry['position.direction'].ts)) - latTs < 0.1
            ? Number.parseInt(this.telemetry['position.direction'].value)
            : 0
        this.updateMarkerDirection(id, direction)
        this.markers[id].setLatLng([lat, lon]).update()
      }
      if (this.tracks[id] instanceof L.Polyline) {
        this.tracks[id].setLatLngs(this.devicesStates[id].telemetryTail)
      }
      if (this.isSelectedDeviceFollowed) {
        this.centerOnDevice(this.selectedDeviceId, this.map.getZoom())
      }
    },
    viewOnMapHandler(content) {
      if (content['position.latitude'] && content['position.longitude']) {
        const position = [content['position.latitude'], content['position.longitude']],
          currentZoom = this.map.getZoom()
        if (this.map.messagePoint) {
          this.map.messagePoint.remove()
        }
        this.map.messagePoint = L.marker(position, {
          icon: L.divIcon({
            className: `my-round-marker-wrapper`,
            iconSize: new L.Point(10, 10),
            html: `<div class="my-round-marker"></div>`,
          }),
        })
        this.map.messagePoint.addTo(this.map)
        this.map.setView(position, currentZoom > 12 ? currentZoom : 12, { animation: false })
      } else {
        this.$q.notify({
          message: 'No position',
          color: 'warning',
          position: 'bottom-left',
          icon: 'mdi-alert-outline',
        })
      }
    },
  },
  watch: {
    activeDevices(newVal) {
      const activeDevicesIDs = newVal.map((device) => device.id)
      const currentDevicesIDs = Object.keys(this.messagesStores).map((id) => parseInt(id))

      const modifyType = currentDevicesIDs.length > activeDevicesIDs.length ? 'remove' : 'add'
      /* ensure all active devices have messages stores */
      activeDevicesIDs.forEach((id) => this.initMessagesStoreForDevice(id))
      /* sync IDs of active devices */
      this.activeDevicesIDs = activeDevicesIDs
      switch (modifyType) {
        case 'remove': {
          const removedDevicesIDs = currentDevicesIDs.filter((id) => !activeDevicesIDs.includes(id))
          removedDevicesIDs.forEach(async (id) => {
            await this.messagesStores[id].clear()
            delete this.messagesStores[id]
            this.devicesStates[id].initStatus = null
          })
          break
        }
        case 'add': {
          const addedDeviceIDs = activeDevicesIDs.filter((id) => !currentDevicesIDs.includes(id))
          if (addedDeviceIDs) {
            addedDeviceIDs.forEach((id) => {
              this.devicesStates[id].initStatus = false
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
    date() {
      this.player.status = 'stop'
      this.player.currentMsgIndex = null
      this.activeDevicesIDs.forEach(async (id) => {
        if (this.devicesStates[id].initStatus === true) {
          await this.getDeviceData(id)
        }
      })
    },
    colorModel(color) {
      /* color modal dialog returned new selected color for the device - save it to the store */
      this.updateDeviceColor(this.colorDeviceId, color)
    },
    devicesColors: {
      /* devices colors are changed in the store - redraw tracks and markers on the map with new colors */
      deep: true,
      handler(newVal) {
        this.activeDevicesIDs.forEach((id) => {
          if (this.markers[id] && this.markers[id].color && newVal[id] !== this.markers[id].color) {
            this.updateDeviceColorOnMap(id, newVal[id])
          }
        })
      },
    },
    isSelectedDeviceFollowed(state) {
      if (
        state === true &&
        this.devicesStates[this.selectedDeviceId] &&
        this.devicesStates[this.selectedDeviceId].initStatus === true
      ) {
        /* user enabled following the selected device on map */
        /* center on device, if device is already initialized */
        this.centerOnDevice(this.selectedDeviceId, this.map.getZoom())
      }
    },
    messages: {
      deep: true,
      handler(messages) {
        this.debouncedUpdateStateByMessages(messages)
      },
    },
    'params.needShowNamesOnMap': function () {
      Object.keys(this.markers).forEach((id) => {
        const currentDevice = this.activeDevices.filter((device) => device.id === parseInt(id))[0],
          position =
            this.messages[id] && this.messages[id].length
              ? [
                  this.messages[id][this.messages[id].length - 1]['position.latitude'],
                  this.messages[id][this.messages[id].length - 1]['position.longitude'],
                ]
              : [],
          name = currentDevice.name || `#${id}`
        if (this.markers[id] instanceof L.Marker) {
          this.markers[id].remove()
          this.map.removeLayer(this.markers[id].accuracy)
          this.initMarker(id, name, position)
        }
      })
    },
    'params.needShowInvalidPositionMessages': function () {
      this.activeDevicesIDs.forEach(async (id) => {
        // reinit device data, as now device may have last position from telemetry
        if (this.devicesStates[id].initStatus === true) {
          await this.getDeviceData(id)
          if (id === this.selectedDeviceId) {
            this.centerOnDevice(id)
          }
        }
      })
    },
    selectedDeviceId(id) {
      if (!this.mapIsFlying && this.tracks[id] && this.tracks[id] instanceof L.Polyline) {
        const bounding = this.tracks[id].getBounds()
        this.map.fitBounds(bounding)
      }
      if (
        id &&
        this.devicesStates[id] &&
        this.devicesStates[id].telemetryTail &&
        this.devicesStates[id].telemetryTail.length > 0
      ) {
        /* wwhen selected device has changed, discard previous telemetry tail, if any so that to start drawing tail from the scratch */
        this.devicesStates[id].telemetryTail = []
      }
      if (id && this.devicesStates[id] && this.devicesStates[id].initStatus === true) {
        this.flyToDevice(id)
      }
    },
    telemetry: {
      deep: true,
      handler() {
        if (this.telemetryKeys.length === 0) {
          /* telemetry drawer is closed and telemetry is not tracked any more */
          return
        }
        const deviceId = parseInt(this.telemetry['device.id'].value)
        if (this.devicesStates[deviceId] && this.devicesStates[deviceId].messagesAccess) {
          /* this device is positioned by messages, no need to draw its position by telemetry */
          return false
        }
        this.debouncedUpdateStateByTelemetry(deviceId)
      },
    },
  },
  created() {
    /* init map staff here, so that it wasn't reactive */
    ;(this.map = null), // map instance
      (this.markers = {}), // markers on map
      (this.tracks = {}), // tracks on map
      /* create debounced function for processing messages and telemetry */
      (this.debouncedUpdateStateByMessages = debounce(this.updateStateByMessages, 100))
    this.debouncedUpdateStateByTelemetry = debounce(this.updateStateByTelemetry, 5)
    /* create messages stores for active devices */
    this.activeDevicesIDs = this.activeDevices.map((device) => device.id)
    this.activeDevicesIDs.forEach((id) => this.initMessagesStoreForDevice(id))
  },
  mounted() {
    this.initMap()
  },
  unmounted() {
    this.$connector.socket.off('offline')
    this.$connector.socket.off('connect')
    this.activeDevicesIDs.forEach(async (id) => {
      if (this.socketConnected === true) {
        await this.messagesStores[id].clear()
      } else {
        this.messagesStores[id].resetState()
      }
      delete this.messagesStores[id]
      this.devicesStates[id].initStatus = null
    })
  },
})
</script>

<style lang="sass">
.leaflet-control-layers
  top: 110px
  .leaflet-control-layers-toggle
    width: 24px
    height: 24px
    background-size: 20px
.leaflet-container.crosshair-cursor-enabled
  cursor: crosshair
.leaflet-control.leaflet-bar
  top: 50px
  left: 6px
  border: none
  .leaflet-control-zoom-in, .leaflet-control-zoom-out
    background-color: #fff
    color: #333
    border-color: #666
    box-shadow: 0 0 15px rgba(0,0,0,0.5)
  .leaflet-control-zoom-in
    border-top-left-radius: 3px
    border-top-right-radius: 3px
  .leaflet-control-zoom-out
    border-bottom-left-radius: 3px
    border-bottom-right-radius: 3px
.my-flag-icon__inner
  font-size: 35px
  position: relative
  top: -20px
  left: 2px
.my-div-icon
  z-index: 2000!important
  .my-div-icon__name
    line-height: 20px
    font-size: .9rem
    font-weight: bolder
    position: absolute
    top: 0
    left: 30px
    max-width: 200px
    text-overflow: ellipsis
    overflow: hidden
    background-color: rgba(0,0,0,0.5)
    color: #fff
    border-radius: 5px
    padding: 0 5px
    border: 1px solid white
    box-shadow: 3px 3px 10px #999
.direction
  border: 2px solid black
  border-radius: 50% 0 50% 50%
  background-color: white
  opacity: .5
  height: 20px
  width: 20px
.my-round-marker
  height: 10px
  border-radius: 50%
  background-color: $red-7
  transform: scale(1)
  box-shadow: 0 0 0 0 rgba(255, 82, 82, 1)
  animation: pulse 2s infinite

@keyframes pulse
  0%
    transform: scale(0.95)
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7)
  70%
    transform: scale(1)
    box-shadow: 0 0 0 10px rgba(255, 82, 82, 0)
  100%
    transform: scale(0.95)
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0)
</style>
