<template>
  <div
    v-if="!item['__connectionStatus']"
    @click="itemClickHandler(index, clearItem)"
    class="cursor-pointer"
    :class="[item.__status ? 'missed-items' : '']"
    :style="{height: `${itemHeight}px`, width: `${rowWidth}px`, backgroundColor: item['x-flespi-inited-by-telemetry'] ? 'rgba(111, 101, 19, 0.7)' : selected ? 'rgba(255,255,255,0.7)': '', color: selected ? '#333' : '', borderBottom: item.delimiter ? 'solid 1px #f40' : ''}">
    <span class="list__item item_actions" v-if="actionsVisible">
      <q-icon v-for="(action, i) in actions" :key="i" @click.stop.native="clickHandler(index, action.type, clearItem)" :class="action.classes" class="cursor-pointer on-left" :name="action.icon">
        <q-tooltip>{{action.label}}</q-tooltip>
      </q-icon>
    </span>
    <span v-for="(prop, k) in cols" :key="prop.name + k" class="list__item" :class="{[`item_${k}`]: true}" :title="values[prop.name].value">
      {{values[prop.name].value}}
    </span>
    <span v-if="etcVisible" class="list__item item_etc">{{values.etc.value || '*Empty*'}}</span>
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
    'selected'
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
          res[col.name] = { value: null }
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
        if (propName.indexOf('#') !== -1) {
          let splitedName = propName.split('#'),
            name = splitedName[0],
            index = splitedName[1]
          if (vals[name]) {
            if (!vals[name].value) {
              vals[name].value = {}
            } else if (typeof vals[name].value !== 'object') {
              let value = vals[name].value
              vals[name].value = { [index - 1]: value }
            }
            vals[name].value[index] = this.getValue(this.item[propName])
          } else {
            vals.etc.value += `${propName}: ${this.getValue(this.item[propName])}; `
          }
        } else if (vals[propName]) {
          let value = this.item[propName]
          if (propName.indexOf('timestamp') !== -1) {
            value = date.formatDate(value * 1000, 'DD/MM/YYYY HH:mm:ss')
          }
          if (propName.indexOf('image.bin.') !== -1) {
            value = '<binary image>'
          }
          vals[propName].value = this.getValue(value)
        } else {
          if (propName === 'delimiter' || propName === '__status' || propName === 'x-flespi-inited-by-telemetry') { return false }
          if (propName.indexOf('image.bin.') !== -1) {
            vals.etc.value += `${propName}: <binary image>`
          } else {
            vals.etc.value += `${propName}: ${this.getValue(this.item[propName])}; `
          }
        }
      })
      Object.keys(vals).forEach((key) => {
        if (typeof vals[key].value === 'object' && vals[key].value) {
          if (vals[key].value instanceof Array) {
            let buff = vals[key].value.reduce((acc, item, index, arr) => {
              acc += item
              if (index !== arr.length - 1) {
                acc += ', '
              }
              return acc
            }, '')
            vals[key].value = buff
          } else if (vals[key].value instanceof Object) {
            let buff = Object.keys(vals[key].value).reduce((acc, name, index, arr) => {
              acc += `${name}: ${vals[key].value[name]}`
              if (index !== arr.length - 1) {
                acc += ', '
              }
              return acc
            }, '')
            vals[key].value = buff
          }
        }
      })
      return vals
    },
    clearItem () {
      return Object.keys(this.item).reduce((result, key) => {
        if (
          key === 'delimiter' ||
          key === '__status' ||
          key === 'uuid' ||
          key === 'x-flespi-filter-fields' ||
          key === 'x-flespi-filter-next' ||
          key === 'x-flespi-filter-prev' ||
          key === 'x-flespi-inited-by-telemetry'
        ) {
          return result
        }
        result[key] = this.item[key]
        return result
      }, {})
    }
  },
  methods: {
    clickHandler (index, type, content) {
      this.$emit(`action`, { index, type, content })
    },
    itemClickHandler (index, content) {
      this.$emit(`item-click`, { index, content })
    },
    getValue (value) {
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
  }
}
</script>

<style lang="stylus">
  .list__item
    display inline-block
    white-space nowrap
    margin 0 10px 0 5px
    text-overflow ellipsis
    overflow hidden
  .message-viewer .q-w-list>.missed-items
    background-color rgba(255,255,255,.05)
    &:nth-child(odd)
      background-color rgba(255,255,255,.1)
</style>
