<template>
  <div>
    <virtual-scroll-list
      ref="scrollList"
      :actions="actions"
      :cols="messagesStore.cols"
      :items="messagesStore.messages"
      :theme="theme"
      :viewConfig="viewConfig"
      class="scrollable"
      @action-to-bottom="toBottomClickHandler"
      @action="actionHandler"
      @update-cols="updateColsHandler"
    >
      <template #list-item="{ item, index, cols, itemHeight, rowWidth }">
        <messages-list-item
          :item="item"
          :index="index"
          :cols="cols"
          :itemHeight="itemHeight"
          :rowWidth="rowWidth"
          :menuCellActive="true"
          :selected="false"
          @item-click="messageListItemClickHandler"
        />
      </template>
    </virtual-scroll-list>
    <message-viewer
      inverted
      ref="messageViewer"
      :message="typeof selectedMessageContent !== 'undefined' ? selectedMessageContent : {}"
      @close="closeMessageViewerHandler"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { mapActions } from 'pinia'
import { VirtualScrollList } from 'qvirtualscroll'
import { useMiscStore } from 'src/stores/misc'
import { useDevicesStore } from 'src/stores/devices'
import MessagesListItem from './MessagesListItem.vue'
import MessageViewer from './MessageViewer.vue'

const config = {
  actions: [
    {
      icon: 'mdi-eye',
      label: 'Show message',
      classes: '',
      type: 'view',
    },
  ],
  viewConfig: {
    needShowDateRange: false,
    needShowFilter: false,
  },
  theme: {
    color: 'white',
    bgColor: 'grey-9',
    contentInverted: true,
    controlsInverted: true,
  },
}

export default defineComponent({
  name: 'DeviceMessages',
  components: {
    MessagesListItem,
    MessageViewer,
    VirtualScrollList,
  },
  emits: ['view-message-content', 'view-on-map'],
  props: ['activeMessagesIds', 'id', 'limit'],
  data() {
    const style = document.createElement('style')
    style.type = 'text/css'
    const head = document.head || document.getElementsByTagName('head')[0]
    const dynamicCSS = head.appendChild(style)
    return {
      actions: config.actions,
      dynamicCSS,
      selectedMessageContent: undefined,
      theme: config.theme,
      viewConfig: config.viewConfig,
    }
  },
  computed: {
    currentLimit: {
      get() {
        return this.messagesStore.limit
      },
      set(val) {
        val = val || 0
        this.messagesStore.setLimit(val)
      },
    },
    messagesStore() {
      return this.getMessagesStore(this.id)
    },
    selectedMessageTimestamp: {
      get() {
        // only one message can be selected by design
        // so convert selected array from messages store to one index
        const selected = this.messagesStore.selected
        let lastSelected = selected.slice(-1)[0]
        return lastSelected === undefined ? -1 : lastSelected
      },
      set(timestamp) {
        // convert one timestamp to the array of selected timestamps for messages store
        this.messagesStore.setSelected([timestamp])
      },
    },
  },
  methods: {
    ...mapActions(useMiscStore, ['getMessagesStore']),
    actionHandler({ index, type, content }) {
      if (type !== 'view') {
        return
      }
      /* this is Show message action handler */
      this.selectedMessageContent = content
      this.selectedMessageTimestamp = content.timestamp
      this.highlightSelectedMessage()
      this.$refs.messageViewer.show()
      this.$emit('view-message-content')
    },
    closeMessageViewerHandler() {
      this.selectedMessageContent = undefined
      this.selectedMessageTimestamp = undefined
      this.highlightSelectedMessage()
    },
    highlightSelectedMessage() {
      let css = ''
      if (this.selectedMessageTimestamp !== undefined) {
        css = `.row_${this.selectedMessageTimestamp} {background-color: rgba(255,255,255,0.7)!important; color: #333;}`
      }
      this.updateDynamicCSS(css)
    },
    messageListItemClickHandler({ index, content }) {
      if (this.selectedMessageTimestamp === content) {
        // unselect message, if it was previously selected
        this.selectedMessageTimestamp = undefined
      } else {
        // select new message
        this.selectedMessageTimestamp = content.timestamp
      }
      this.highlightSelectedMessage()
      this.$emit('view-on-map', content)
    },
    messageShow(indexes) {
      const index = this.messagesStore.messages.findIndex(el => el.timestamp === this.selectedMessageTimestamp)
      if (index !== indexes[indexes.length - 1]) {
        this.selectedMessageTimestamp = this.messagesStore.messages[indexes[indexes.length - 1]].timestamp
        this.highlightSelectedMessage()
        this.scrollToSelected()
      }
    },
    scrollToSelected() {
      if (this.selectedMessageTimestamp >= 0 && this.$refs.scrollList) {
        const itemsCount = this.$refs.scrollList.itemsCount
        let scrollToIndex = this.messagesStore.messages.findIndex(el => el.timestamp === this.selectedMessageTimestamp)
        scrollToIndex -= Math.floor(itemsCount / 2)
        if (scrollToIndex < 0) {
          scrollToIndex = 0
        }
        this.$refs.scrollList.scrollTo(scrollToIndex)
      }
    },
    toBottomClickHandler() {
      // TODO: remember that user enabled sticking to bottom for this device
    },
    updateDynamicCSS(content) {
      if (this.dynamicCSS.styleSheet) {
        this.dynamicCSS.styleSheet.cssText = content
      } else {
        this.dynamicCSS.innerText = content
      }
    },
    updateColsHandler (cols) {
      /* user updated columns in the grid: set updated columns to the devices messages store */
      this.messagesStore.setCols(cols)
    }
  },
  watch: {
    activeMessagesIds(indexes) {
      this.messageShow(indexes)
    },
    limit(limit) {
      this.currentLimit = limit
    },
    selectedMessageTimestamp() {
      if (this.selectedMessageTimestamp > 0) {
        this.scrollToSelected(this.selectedMessageTimestamp)
      }
      this.highlightSelectedMessage()
    },
  },
  created() {
    const device = useDevicesStore().getDeviceById(this.id)
    if (device && device.device_type_id) {
      /* update cols for current device type from local storage, as it might have beed changed */
      this.messagesStore.syncColsFromLS(useDevicesStore().getDeviceById(this.id).device_type_id)
    }
    this.currentLimit = this.limit
    this.highlightSelectedMessage(this.activeMessagesIds)
  },
  unmounted() {
    this.messagesStore.clearSelected()
    this.dynamicCSS.parentNode.removeChild(this.dynamicCSS)
  },
})
</script>

<style lang="sass">
.message-viewer
  .list-wrapper
    background-color: inherit!important
    .list__content
      background-color: rgba(0,0,0,0.15)!important
    .list__header
      background-color: rgba(97, 97, 97, 0.8)!important
.q-table__card
  border-radius: 0
</style>
