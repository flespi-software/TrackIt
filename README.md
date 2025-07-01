# Track It!

> A GPS tracking application based on [flespi.io](https://flespi.io) and built with [Quasar](https://quasar.dev/) and [Leaflet.js](https://leafletjs.com/). Shows devices on the map and their telemetry messages; includes a track player.

![Screenshot](/misc/screenshot.jpg?raw=true "Track it!")

Current `master` works on Vue 3.
Vue 2 branch [is here](https://github.com/flespi-software/TrackIt/tree/vue2).<br />

## Features
* ES6 Javascript
* Vue.js
* Writing .vue files
* Pinia
* Vite
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
flespi/state/gw/devices/{selector}/telemetry/+<br />

## Requirements:
[flespi token](https://flespi.com/kb/tokens-access-keys-to-flespi-platform#token-trackit "flespi knowledge base article")<br />

## Build Setup

``` bash
# clone the repo
$ git clone https://github.com/flespi-software/TrackIt.git mytracker

# go into app's directory and install dependencies
$ cd mytracker
$ npm install

# start the app in development mode with hot reload at localhost:7006
$ npm run dev

# build the app for production with minification
$ npm run build

# app checks if local flespi installation is available at localhost:9005
# is local flespi installation is running, then it's used as backend
# otherwise flespi.io is used as backend
```
## Demo
Check it out [live](https://trackit.flespi.io)!

## License
[MIT](https://github.com/flespi-software/TrackIt/blob/master/LICENSE) license.
