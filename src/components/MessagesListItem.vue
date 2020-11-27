<template>
  <div
    v-if="!item['__connectionStatus']"
    @click="itemClickHandler(index, clearItem)"
    class="cursor-pointer"
    :class="{'missed-items': item['x-flespi-status'], 'item--telemetry-inited': item['x-flespi-inited-by-telemetry']}"
    :style="{height: `${itemHeight}px`, width: `${rowWidth}px`, borderBottom: item.delimiter ? 'solid 1px #f40' : ''}"
  >
    <template v-for="(prop, k) in cols">
      <span v-if="prop.__dest === 'etc'" class="list__item item_etc" :class="{[`item_${k}`]: true, 'item--active': menuCellActive && menuCellActive.row === index && menuCellActive.col === k}" :key="prop.name + k">{{values.etc.value || '*Empty*'}}</span>
      <span v-else :key="prop.name + k" class="list__item" :class="{[`item_${k}`]: true, 'item--active': menuCellActive && menuCellActive.row === index && menuCellActive.col === k}" :title="values[prop.name].value">
        {{values[prop.name].value}}
      </span>
    </template>
  </div>
  <div
    v-else
    :style="{
      height: `${itemHeight}px`,
      width: `${rowWidth}px`,
      border: 'solid 1px #000',
      color: '#000',
      fontWeight: 'bold',
      backgroundColor: item.__connectionStatus === 'offline' ? '#ff0' : '#0f0',
      backgroundImage: 'url(./statics/police.png)',
      overflow: 'hidden',
      opacity: '.7'
    }"
    :title="date.formatDate(item.timestamp, 'DD/MM/YYYY HH:mm:ss')"
  >
    <span style="padding: 0 5px; margin-left: 150px;" :style="{ backgroundColor: item.__connectionStatus === 'offline' ? '#ff0' : '#0f0'}" class="uppercase" v-for="n in Array(10)" :key="n">{{item['__connectionStatus']}}</span>
  </div>
</template>

<script>
import { date } from 'quasar'

export default {
  props: [
    'item',
    'index',
    'actions',
    'cols',
    'itemHeight',
    'etcVisible',
    'rowWidth',
    'actionsVisible',
    'selected',
    'menuCellActive'
  ],
  data () {
    return {
      date: date
    }
  },
  computed: {
    values () {
      let vals = {}
      if (this.cols.length) {
        vals = this.cols.reduce((res, col, index, arr) => {
          res[col.name] = { value: this.getValueOfProp(col, this.item) }
          if (index === arr.length - 1) {
            res.etc = { value: '' }
          }
          return res
        }, {})
      } else {
        vals = {
          etc: { value: '' }
        }
      }
      Object.keys(this.item).forEach((propName) => {
        if (!vals[propName]) {
          if (propName.indexOf('x-flespi') !== -1) { return false }
          if (propName.indexOf('image.bin.') !== -1) {
            vals.etc.value += `${propName}: <binary image>`
          } else {
            vals.etc.value += `${propName}: ${JSON.stringify(this.item[propName])}; `
          }
        }
      })
      return vals
    },
    clearItem () {
      return Object.keys(this.item).reduce((result, key) => {
        if (key === 'uuid' || key.indexOf('x-flespi') !== -1) {
          return result
        }
        result[key] = this.item[key]
        return result
      }, {})
    }
  },
  methods: {
    clickHandler (index, type, content) {
      this.$emit('action', { index, type, content })
    },
    itemClickHandler (index, content) {
      this.$emit('item-click', { index, content })
    },
    getValue (value) {
      return typeof value === 'string' ? value : JSON.stringify(value)
    },
    getValueOfProp (prop, item) {
      const propName = prop.name
      let value = item[propName]
      if (propName.match(/timestamp$/)) {
        value = date.formatDate(value * 1000, 'DD/MM/YYYY HH:mm:ss')
      } else if (propName.indexOf('image.bin.') !== -1) {
        value = '<binary image>'
      } else if (typeof value !== 'string') {
        value = JSON.stringify(value)
      }
      return value
    }
  }
}
</script>

<style lang="stylus">
  .item--telemetry-inited
    background-color rgba(111, 101, 19, 0.7)!important
  .list__item
    display inline-block
    min-height 19px
    white-space nowrap
    padding-left 5px
    text-overflow ellipsis
    overflow hidden
    border-right 2px solid $grey-8
    line-height 19px
  .item--active
    background-color $grey-7
  .message-viewer .q-w-list>.missed-items
    background-color rgba(255,255,255,.05)
    &:nth-child(odd)
      background-color rgba(255,255,255,.1)
</style>
