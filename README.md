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

- [Node.js](https://nodejs.org/en/) (>=18.x)
- [npm](https://www.npmjs.com/) version 10+ and [Git](https://git-scm.com/).

## Used API resurces:

REST<br />
https://flespi.io/gw/devices/{selector}<br />
https://flespi.io/gw/devices/{selector}/telemetry<br />
https://flespi.io/gw/devices/{selector}/messages<br />
MQTT<br />
flespi/log/gw/devices/{selector}/created<br />
flespi/log/gw/devices/{selector}/updated<br />
flespi/log/gw/devices/{selector}/deleted<br />
flespi/message/gw/devices/{selector}/#<br />

## Requirements:
You need to have a separate token with at least the following ACLs:<br />
REST<br />
https://flespi.io/gw/devices/{selector}<br />
https://flespi.io/gw/devices/{selector}/telemetry<br />
https://flespi.io/gw/devices/{selector}/messages<br />
https://flespi.io/gw/protocols

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
