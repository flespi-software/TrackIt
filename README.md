# Track It!

> A GPS tracking application based on [flespi.io](https://flespi.io) and built with [Quasar](http://quasar-framework.org) and [Leaflet.js](http://leafletjs.com). Shows devices on the map and their telemetry messages; includes a track player.

![Screenshot](/misc/screenshot.jpg?raw=true "Track it!")

## Features
* ES6 Javascript
* Vue.js
* Writing .vue files
* Vuex
* Webpack
* Responsive layout
* NPM ecosystems
* Leaflet
* Material theme
* Dev Hot Reload
* and many more!

## Prerequisites:

- [Node.js](https://nodejs.org/en/) (>=6.x)
- npm version 3+ and [Git](https://git-scm.com/).

## Requirements:
You need to have a separate token with at least the following ACLs:
REST
https://flespi.io/gw/devices/{selector}
https://flespi.io/gw/devices/{selector}/telemetry
https://flespi.io/gw/devices/{selector}/messages
MQTT
flespi/log/gw/devices/{selector}/created
flespi/log/gw/devices/{selector}/updated
flespi/log/gw/devices/{selector}/deleted
flespi/message/gw/devices/{selector}/#

## Build Setup

``` bash
# clone the repo
$ git clone https://github.com/flespi-software/TrackIt.git mytracker

# go into app's directory and install dependencies
$ cd mytracker
$ npm install

# serve with hot reload at localhost:7006 for flespi.io
$ npm run dev

# build for production with minification for flespi.io
$ npm run build

# serve with hot reload at localhost:7006 for localhost:9005
$ npm run dev_local
```
## Demo
Check it out [live](http://trackit.flespi.io)!

## License
[MIT](https://github.com/flespi-software/TrackIt/blob/master/LICENSE) license.
