<template>
  <div>
    <virtual-scroll-list
      ref="scrollList"
      :cols="cols"
      :actions="actions"
      :items="messages"
      :date="from"
      :mode="mode"
      :viewConfig="viewConfig"
      :colsConfigurator="'toolbar'"
      :i18n="i18n"
      :theme="theme"
      :title="'Messages'"
      @change:pagination-prev="paginationPrevChangeHandler"
      @change:pagination-next="paginationNextChangeHandler"
      @change:date="dateChangeHandler"
      @change:date-prev="datePrevChangeHandler"
      @change:date-next="dateNextChangeHandler"
      @update:cols="updateColsHandler"
    >
      <messages-list-item slot="items" slot-scope="{item, index, actions, cols, etcVisible, actionsVisible, itemHeight, rowWidth}"
                          :item="item"
                          :key="`${JSON.stringify(item)}${index}`"
                          :index="index"
                          :actions="actions"
                          :cols="cols"
                          :itemHeight="itemHeight"
                          :rowWidth="rowWidth"
                          :etcVisible="etcVisible"
                          :actionsVisible="actionsVisible"
                          :selected="index === selected"
                          @item-click="viewMessagesHandler"
      />
    </virtual-scroll-list>
    <message-viewer ref="messageViewer" :message="typeof selectedMessage !== 'undefined' ? selectedMessage : {}" inverted @close="closeHandler"></message-viewer>
  </div>
</template>

<script>
import { VirtualScrollList } from 'qvirtualscroll'
import MessageViewer from './MessageViewer'
import { date } from 'quasar'
import MessagesListItem from './MessagesListItem.vue'

const config = {
  'actions': [],
  'viewConfig': {
    'needShowFilter': false,
    'needShowMode': false,
    'needShowPageScroll': false,
    'needShowDate': false,
    'needShowEtc': true
  },
  'theme': {
    'color': 'white',
    'bgColor': 'dark',
    'contentInverted': true,
    'controlsInverted': true
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
    return {
      selectedMessage: undefined,
      theme: config.theme,
      i18n: {},
      viewConfig: config.viewConfig,
      actions: config.actions,
      moduleName: this.activeDeviceId
    }
  },
  computed: {
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
        val ? this.$store.commit(`messages/${this.moduleName}/setFrom`, val) : this.$store.commit(`messages/${this.moduleName}/setFrom`, 0)
      }
    },
    to: {
      get () {
        return this.$store.state.messages[this.moduleName].to
      },
      set (val) {
        val ? this.$store.commit(`messages/${this.moduleName}/setTo`, val) : this.$store.commit(`messages/${this.moduleName}/setTo`, 0)
      }
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
        val ? this.$store.commit(`messages/${this.moduleName}/setLimit`, val) : this.$store.commit(`messages/${this.moduleName}/setLimit`, 1000)
      }
    },
    selected: {
      get () {
        return this.$store.state.messages[this.moduleName].selected
      },
      set (val) {
        this.$store.commit(`messages/${this.moduleName}/setSelected`, val)
      }
    }
  },
  methods: {
    resetParams () {
      this.$refs.scrollList.resetParams()
    },
    setTranslate (messages) {
      this.i18n.from = messages.length ? `Previous batch until ${date.formatDate(messages[0].timestamp * 1000, 'HH:mm:ss')}` : 'Prev'
      this.i18n.to = messages.length ? `Next batch from ${date.formatDate(messages[messages.length - 1].timestamp * 1000, 'HH:mm:ss')}` : 'Next'
    },
    updateColsHandler (cols) {
      this.cols = cols
    },
    dateChangeHandler (date) {
      this.$store.dispatch(`messages/${this.moduleName}/get`, {name: 'setDate', payload: date})
    },
    datePrevChangeHandler () {
      this.$store.dispatch(`messages/${this.moduleName}/get`, {name: 'datePrev'})
    },
    dateNextChangeHandler () {
      this.$store.dispatch(`messages/${this.moduleName}/get`, {name: 'dateNext'})
    },
    paginationPrevChangeHandler () {
      let timestamp = 0
      timestamp = this.messages.length ? this.messages[0].timestamp * 1000 : 0
      this.$store.dispatch(`messages/${this.moduleName}/get`, {name: 'paginationPrev', payload: timestamp})
    },
    paginationNextChangeHandler () {
      let timestamp = 0
      timestamp = this.messages.length ? this.messages[this.messages.length - 1].timestamp * 1000 : 0
      this.$store.dispatch(`messages/${this.moduleName}/get`, {name: 'paginationNext', payload: timestamp})
    },
    viewMessagesHandler ({index, content}) {
      this.selected = index
      this.selectedMessage = content
      this.$refs.messageViewer.show()
      this.$emit('view')
    },
    closeHandler () {
      this.selected = null
      this.selectedMessage = undefined
      if (this.activeMessagesIds.length) {
        this.selected = this.activeMessagesIds[this.activeMessagesIds.length - 1]
      }
    },
    copyMessageHandler ({index, content}) {
      this.$copyText(JSON.stringify(content)).then((e) => {
        this.$q.notify({
          type: 'positive',
          icon: 'content_copy',
          message: `Message copied`,
          timeout: 1000
        })
      }, (e) => {
        this.$q.notify({
          type: 'negative',
          icon: 'content_copy',
          message: `Error coping messages`,
          timeout: 1000
        })
      })
    },
    unselect () {
      if (this.selected) {
        this.selected = null
      }
    },
    highlightSelected (indexes) {
      if (indexes.length) {
        indexes.forEach((index) => {
          this.selected = index
        })
      }
    }
  },
  watch: {
    limit (limit) {
      this.currentLimit = limit
    },
    activeMessagesIds (indexes) {
      this.highlightSelected(indexes)
    }
  },
  async created () {
    this.currentLimit = this.limit
    this.highlightSelected(this.activeMessagesIds)
  },
  components: { VirtualScrollList, MessagesListItem, MessageViewer }
}
</script>
<style lang="stylus">
.message-viewer
  .list-wrapper
    background-color inherit!important
    .bg-dark
      background-color rgba(0,0,0,0.5)!important
</style>
