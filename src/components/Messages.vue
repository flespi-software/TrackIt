<template>
  <div>
    <virtual-scroll-list
      ref="scrollList"
      :cols="cols"
      :actions="actions"
      :items="messages"
      :dateRange="dateRange"
      :mode="mode"
      :viewConfig="viewConfig"
      :colsConfigurator="'toolbar'"
      :i18n="i18n"
      :theme="theme"
      :title="'Messages'"
      :loading="isLoading"
      @change:date-range="dateRangeChangeHandler"
      @change:date-range-prev="dateRangePrevHandler"
      @change:date-range-next="dateRangeNextHandler"
      @update:cols="updateColsHandler"
    >
      <messages-list-item
        slot="items"
        slot-scope="{item, index, actions, cols, etcVisible, actionsVisible, itemHeight, rowWidth}"
        :item="item"
        :key="`${JSON.stringify(item)}${index}`"
        :index="index"
        :actions="actions"
        :cols="cols"
        :itemHeight="itemHeight"
        :rowWidth="rowWidth"
        :etcVisible="etcVisible"
        :actionsVisible="actionsVisible"
        :selected="selected.includes(index)"
        @item-click="viewMessageOnMap"
        @action='actionHandler'
      />
      <div class="no-messages text-center" slot="empty">
        <div class="text-white" style="font-size: 3rem;">
          <div>No messages</div>
          <div style="font-size: 1.5rem;">or position is empty</div>
        </div>
        <q-btn color="grey-9" v-if="isAdmin && mode === 1" @click="$emit('send', id)">Send message</q-btn>
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
  'actions': [
    {
      icon: 'mdi-eye',
      label: 'view',
      classes: '',
      type: 'view'
    }
  ],
  'viewConfig': {
    'needShowFilter': false,
    'needShowMode': false,
    'needShowPageScroll': false,
    'needShowDate': false,
    'needShowEtc': true
  },
  'theme': {
    'color': 'white',
    'bgColor': 'grey-9',
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
        val ? this.$store.commit(`messages/${this.moduleName}/setLimit`, val) : this.$store.commit(`messages/${this.moduleName}/setLimit`, 0)
      }
    },
    selected: {
      get () {
        return this.$store.state.messages[this.moduleName].selected
      },
      set (val) {
        this.$store.commit(`messages/${this.moduleName}/setSelected`, val)
      }
    },
    isLoading () {
      return this.$store.state.messages[this.moduleName].isLoading
    }
  },
  methods: {
    resetParams () {
      this.$refs.scrollList.resetParams()
    },
    updateColsHandler (cols) {
      this.cols = cols
    },
    dateRangeChangeHandler (range) {
      let from = range[0],
        to = range[1]
      if (this.from === from && this.to === to) { return false }
      this.from = from
      this.to = to
      this.$store.commit(`${this.moduleName}/clearMessages`)
      this.$store.dispatch(`${this.moduleName}/get`)
    },
    dateRangePrevHandler () {
      let delta = this.to - this.from,
        newTo = this.from - 1,
        newFrom = newTo - delta
      this.dateRangeChangeHandler([newFrom, newTo])
    },
    dateRangeNextHandler () {
      let delta = this.to - this.from,
        newFrom = this.to + 1,
        newTo = newFrom + delta
      this.dateRangeChangeHandler([newFrom, newTo])
    },
    viewMessagesHandler ({ index, content }) {
      this.selected = [index]
      this.selectedMessage = content
      this.$refs.messageViewer.show()
      this.$emit('view')
    },
    viewMessageOnMap ({ index, content }) {
      this.$emit('view-on-map', content)
    },
    closeHandler () {
      this.selected = []
      this.selectedMessage = undefined
      if (this.activeMessagesIds.length) {
        this.selected = [this.activeMessagesIds[this.activeMessagesIds.length - 1]]
      }
    },
    copyMessageHandler ({ index, content }) {
      copyToClipboard(JSON.stringify(content)).then((e) => {
        this.$q.notify({
          color: 'positive',
          icon: 'content_copy',
          message: `Message copied`,
          timeout: 1000
        })
      }, (e) => {
        this.$q.notify({
          color: 'negative',
          icon: 'content_copy',
          message: `Error coping messages`,
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
    highlightSelected (indexes) {
      if (indexes.length) {
        indexes.forEach((index) => {
          this.selected = [index]
        })
      }
    },
    scrollToSelected (index) {
      if (index) {
        let itemsCount = this.$refs.scrollList.itemsCount
        let scrollToIndex = index - Math.floor(itemsCount / 2)
        if (scrollToIndex < 0) { return false }
        this.$refs.scrollList.scrollTo(scrollToIndex)
      }
    }
  },
  watch: {
    limit (limit) {
      this.currentLimit = limit
    },
    activeMessagesIds (indexes) {
      this.highlightSelected(indexes)
      this.scrollToSelected(indexes[0])
    }
  },
  async created () {
    this.currentLimit = this.limit
    this.highlightSelected(this.activeMessagesIds)
  },
  destroyed () {
    this.$store.commit(`messages/${this.moduleName}/clearSelected`)
  },
  components: { VirtualScrollList, MessagesListItem, MessageViewer }
}
</script>
<style lang="stylus">
.message-viewer
  .list-wrapper
    background-color inherit!important
    .bg-grey-9, .bg-dark
      background-color rgba(0,0,0,0.5)!important
</style>
