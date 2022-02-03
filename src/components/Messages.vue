<template>
  <div>
    <virtual-scroll-list
      ref="scrollList"
      :cols="cols"
      :actions="actions"
      :items="messages"
      :dateRange="dateRange"
      :viewConfig="viewConfig"
      :theme="theme"
      :title="'Messages'"
      :loading="isLoading"
      :autoscroll="needAutoscroll"
      scrollOffset="10%"
      :item="listItem"
      :itemprops="getItemsProps"
      @action-to-bottom="actionToBottomHandler"
      @update-cols="updateColsHandler"
      @scroll-bottom="scrollBottomHandler"
      @action="actionHandler"
    >
      <div class="no-messages text-center" slot="empty">
        <div class="text-white" style="font-size: 3rem;">
          <div>No messages</div>
          <div style="font-size: 1.5rem;">or position is empty</div>
        </div>
      </div>
    </virtual-scroll-list>
    <message-viewer ref="messageViewer" :message="typeof selectedMessage !== 'undefined' ? selectedMessage : {}" inverted @close="closeHandler"></message-viewer>
  </div>
</template>

<script>
import { VirtualScrollList } from 'qvirtualscroll'
import MessageViewer from './MessageViewer'
import { copyToClipboard } from 'quasar'
import MessagesListItem from './MessagesListItem.vue'

const config = {
  actions: [
    {
      icon: 'mdi-eye',
      label: 'Show message',
      classes: '',
      type: 'view'
    }
  ],
  viewConfig: {
    needShowFilter: false,
    needShowDate: false,
    needShowEtc: true
  },
  theme: {
    color: 'white',
    bgColor: 'grey-9',
    contentInverted: true,
    controlsInverted: true
  }
}

export default {
  props: [
    'mode',
    'item',
    'activeDeviceId',
    'limit',
    'messages',
    'date',
    'activeMessagesIds'
  ],
  data () {
    const style = document.createElement('style')
    style.type = 'text/css'
    const head = document.head || document.getElementsByTagName('head')[0]
    const dynamicCSS = head.appendChild(style)
    return {
      listItem: MessagesListItem,
      selectedMessage: undefined,
      dynamicCSS,
      theme: config.theme,
      viewConfig: config.viewConfig,
      actions: config.actions,
      moduleName: this.activeDeviceId,
      autoscroll: true
    }
  },
  computed: {
    storedMessages () {
      const messages = this.$store.state.messages[this.moduleName].messages
      this.scrollControlling(messages.length)
      return messages
    },
    cols: {
      get () {
        return this.$store.state.messages[this.moduleName].cols
      },
      set (val) {
        this.$store.commit(`messages/${this.moduleName}/updateCols`, val)
      }
    },
    from: {
      get () {
        return this.$store.state.messages[this.moduleName].from
      },
      set (val) {
        val = val || 0
        this.$store.commit(`messages/${this.moduleName}/setFrom`, val)
      }
    },
    to: {
      get () {
        return this.$store.state.messages[this.moduleName].to
      },
      set (val) {
        val = val || 0
        this.$store.commit(`messages/${this.moduleName}/setTo`, val)
      }
    },
    dateRange () {
      return [this.$store.state.messages[this.moduleName].from, this.$store.state.messages[this.moduleName].to]
    },
    reverse: {
      get () {
        return this.$store.state.messages[this.moduleName].reverse || false
      },
      set (val) {
        this.$store.commit(`messages/${this.moduleName}/setReverse`, val)
      }
    },
    currentLimit: {
      get () {
        return this.$store.state.messages[this.moduleName].limit
      },
      set (val) {
        val = val || 0
        this.$store.commit(`messages/${this.moduleName}/setLimit`, val)
      }
    },
    selected: {
      get () {
        const selected = this.$store.state.messages[this.moduleName].selected
        const lastSelected = selected.slice(-1)[0]
        if (lastSelected !== undefined) {
          this.scrollToSelected(lastSelected)
        }
        return selected
      },
      set (val) {
        if (val && val.length) { this.autoscroll = false }
        this.$store.commit(`messages/${this.moduleName}/setSelected`, val)
      }
    },
    realtimeEnabled () {
      return this.$store.state.messages[this.moduleName].realtimeEnabled
    },
    isLoading () {
      return this.$store.state.messages[this.moduleName].isLoading
    },
    needAutoscroll () {
      return this.realtimeEnabled && !this.selected.length && this.autoscroll
    }
  },
  methods: {
    getItemsProps (index, data) {
      const item = this.messages[index]
      data.key = item['x-flespi-message-key']
      data.class = [`scroll-list-item--${index}`]
      data.props.selected = this.selected.includes(index)
      if (!data.on) { data.on = {} }
      data.on.action = this.actionHandler
      data.on['item-click'] = this.viewMessageOnMap
      data.dataHandler = (col, row, data) => {
        this.autoscroll = false
        return this.listItem.methods.getValueOfProp(col.data, row.data)
      }
    },
    resetParams () {
      this.$refs.scrollList.resetParams()
    },
    updateColsHandler (cols) {
      this.cols = cols
    },
    viewMessagesHandler ({ index, content }) {
      this.selectedMessage = content
      this.highlightSelected([index])
      this.$refs.messageViewer.show()
      this.$emit('view')
    },
    viewMessageOnMap ({ index, content }) {
      this.selected = [index]
      this.$emit('view-on-map', content)
    },
    closeHandler () {
      let selected = []
      this.selectedMessage = undefined
      if (this.activeMessagesIds.length) {
        selected = [this.activeMessagesIds[this.activeMessagesIds.length - 1]]
      }
      this.highlightSelected(selected)
    },
    actionToBottomHandler () {
      this.autoscroll = true
      this.$refs.scrollList.scrollTo(this.messages.length - 1)
    },
    scrollBottomHandler () {
      this.autoscroll = true
    },
    copyMessageHandler ({ index, content }) {
      copyToClipboard(JSON.stringify(content)).then((e) => {
        this.$q.notify({
          color: 'positive',
          icon: 'content_copy',
          message: 'Message copied',
          timeout: 1000
        })
      }, (e) => {
        this.$q.notify({
          color: 'negative',
          icon: 'content_copy',
          message: 'Error coping messages',
          timeout: 1000
        })
      })
    },
    actionHandler ({ index, type, content }) {
      switch (type) {
        case 'view': {
          this.viewMessagesHandler({ index, content })
          break
        }
      }
    },
    unselect () {
      if (this.selected.length) {
        this.selected = []
      }
    },
    updateDynamicCSS (content) {
      if (this.dynamicCSS.styleSheet) {
        this.dynamicCSS.styleSheet.cssText = content
      } else {
        this.dynamicCSS.innerText = content
      }
    },
    highlightSelected (indexes) {
      let css, selected
      if (indexes.length) {
        const lastIndex = indexes[indexes.length - 1]
        selected = [lastIndex]
        css = `.scroll-list-item--${lastIndex} {background-color: rgba(255,255,255,0.7)!important; color: #333;}`
      } else {
        selected = []
        css = ''
      }
      this.selected = selected
      this.updateDynamicCSS(css)
    },
    scrollToSelected (index) {
      if (typeof index === 'number' && index >= 0 && this.$refs.scrollList) {
        const itemsCount = this.$refs.scrollList.itemsCount
        let scrollToIndex = index - Math.floor(itemsCount / 2)
        if (scrollToIndex < 0) { scrollToIndex = 0 }
        this.$refs.scrollList.scrollTo(scrollToIndex)
      }
    },
    messageShow (indexes) {
      if (this.selected[0] !== indexes[indexes.length - 1]) {
        this.highlightSelected(indexes)
        this.scrollToSelected(indexes[indexes.length - 1])
      }
    },
    scrollControlling (count) {
      if (this.selected.length && this.selected[0] + 1000 <= count) {
        this.$store.dispatch(`messages/${this.moduleName}/unsubscribePooling`)
      }
    }
  },
  watch: {
    limit (limit) {
      this.currentLimit = limit
    },
    activeMessagesIds (indexes) {
      this.messageShow(indexes)
    }
  },
  created () {
    this.currentLimit = this.limit
    this.highlightSelected(this.activeMessagesIds)
  },
  destroyed () {
    this.$store.commit(`messages/${this.moduleName}/clearSelected`)
    this.dynamicCSS.parentNode.removeChild(this.dynamicCSS)
  },
  components: { VirtualScrollList, MessageViewer }
}
</script>
<style lang="stylus">
.message-viewer
  .list-wrapper
    background-color inherit!important
    .list__content
      background-color rgba(0,0,0,0.15)!important
    .list__header
      background-color rgba(97, 97, 97, 0.8)!important
</style>
