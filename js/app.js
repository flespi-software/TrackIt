webpackJsonp([10],{34:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=n(0),s=n(9),r=n(38),a=n(51),c=n(86);n.n(c);n(35),i.a.config.productionTip=!1,i.a.config.flespiServer="https://flespi.io",i.a.use(s.G),s.a.set("#333333"),n(84),s.G.start(function(){new i.a({el:"#q-app",router:r.a,store:a.a,render:function(e){return e(n(88))}})})},35:function(e,t){},38:function(e,t,n){"use strict";function i(e){return function(){return n(40)("./"+e+".vue")}}var s=n(0),r=n(39);s.a.use(r.a),t.a=new r.a({routes:[{path:"/",component:i("Index")},{path:"/login",component:i("Login")},{path:"/login/:token",component:i("Login")},{path:"*",component:i("Error404")}]})},40:function(e,t,n){function i(e){var t=s[e];return t?n.e(t[1]).then(function(){return n(t[0])}):Promise.reject(new Error("Cannot find module '"+e+"'."))}var s={"./Device.vue":[94,8],"./DeviceList.vue":[97,4],"./Error404.vue":[101,7],"./Index.vue":[102,0],"./Login.vue":[100,6],"./Map.vue":[98,1],"./PostMessageModal.vue":[96,5],"./Queue.vue":[95,3],"./Telemetry.vue":[99,2]};i.keys=function(){return Object.keys(s)},i.id=40,e.exports=i},51:function(e,t,n){"use strict";var i=n(31),s=n(0),r=n(52),a=n(54),c=n(55),o=n(56),u=n(57);s.a.use(r.a),s.a.use(i.b);var v={token:"",devices:[],activeDevicesID:[],hasDevicesInit:!1};t.a=new i.b.Store({state:v,actions:a.a,mutations:c.a,getters:o.a,modules:u.a})},53:function(e,t){},54:function(e,t,n){"use strict";function i(e){var t=e.state,n=e.commit;return n("reqStart"),!!t.token&&r.a.http.get(r.a.config.flespiServer+"/registry/devices/all",{params:{fields:"id,name,ident,phone,telemetry,messages_ttl"}}).then(function(e){return e.json()}).then(function(e){if(n("reqSuccessful",{type:"devices",payload:e}),!t.hasDevicesInit){n("setDevicesInit");var i=a.e.get.item("TrackIt Active Devices");i&&i.length&&i.forEach(function(t){e.result.filter(function(e){return e.id===t}).length&&n("setActiveDevice",t)})}return e.result}).catch(function(e){n("reqFailed",e)})}function s(e,t){var n=(e.state,e.commit),i=t.data,s=t.id;return n("reqStart"),r.a.http.post(r.a.config.flespiServer+"/registry/devices/"+s+"/messages",i).then(function(e){return e.json()}).then(function(e){n("reqSuccessful",{type:"postMessage",payload:e})}).catch(function(e){n("reqFailed",e)})}var r=n(0),a=n(9);t.a={getDevices:i,postMessage:s}},55:function(e,t,n){"use strict";function i(e){}function s(e,t){var n=t.type,i=t.payload,s=i.result;switch(n){case"postMessage":l.F.create.positive({html:"Post message to devices with IDs "+s+" success",icon:"alarm_add",timeout:2500,bgColor:"white"});break;default:m.a.set(e,n,s)}}function r(e,t){switch(t.status){case 401:c(e)}}function a(e,t){var n=t.replace("FlespiToken ","");t&&n.match(/^[a-z0-9]+$/i)?(m.a.http.headers.common.Authorization="FlespiToken "+n,l.e.set("X-Flespi-Token",n)):(n="",c(e)),m.a.set(e,"token",n)}function c(e){var t=l.b.get("X-Flespi-Token"),n=l.e.get.item("X-Flespi-Token");t&&n&&t===n&&l.b.remove("X-Flespi-Token"),l.e.remove("X-Flespi-Token"),m.a.http.headers.common.Authorization="",m.a.set(e,"token","")}function o(e,t){e.devices.filter(function(e){return e.id===t})[0].messages_ttl&&(e.activeDevicesID.push(t),l.e.set("TrackIt Active Devices",e.activeDevicesID))}function u(e,t){e.activeDevicesID=e.activeDevicesID.filter(function(e){return e!==t}),l.e.set("TrackIt Active Devices",e.activeDevicesID)}function v(e){e.hasDevicesInit=!0}function f(e){e.hasDevicesInit=!1,m.a.set(e,"devices",[]),m.a.set(e,"activeDevicesID",[])}var l=n(9),m=n(0);t.a={reqStart:i,reqSuccessful:s,reqFailed:r,setToken:a,clearToken:c,setActiveDevice:o,unsetActiveDevice:u,setDevicesInit:v,unsetDevicesInit:f}},56:function(e,t,n){"use strict";t.a={}},57:function(e,t,n){"use strict";var i=n(58),s=n(61);t.a={telemetry:i.a,messages:s.a}},58:function(e,t,n){"use strict";var i=n(59),s=n(60),r={deviceId:null,telemetry:{}};t.a={namespaced:!0,state:r,actions:i.a,mutations:s.a}},59:function(e,t,n){"use strict";function i(e){var t=e.state,n=e.commit,i=e.rootState;return n("reqStart"),!(!i.token||!t.deviceId)&&s.a.http.get(s.a.config.flespiServer+"/registry/devices/"+t.deviceId,{params:{fields:"telemetry"}}).then(function(e){return e.json()}).then(function(e){return n("setTelemetry",e.result[0]),e.result[0]}).catch(function(e){n("reqFailed",e,{root:!0})})}var s=n(0);t.a={update:i}},60:function(e,t,n){"use strict";function i(e,t){u.a.set(e,"deviceId",t.id||-1),u.a.set(e,"telemetry",t.telemetry||{})}function s(e,t){o()(t.telemetry).forEach(function(n){(!e.telemetry[n]||e.telemetry[n]&&e.telemetry[n].ts!==t.telemetry[n].ts)&&u.a.set(e.telemetry,n,t.telemetry[n])})}function r(e){}function a(e){u.a.set(e,"telemetry",{}),u.a.set(e,"deviceId",null)}var c=n(30),o=n.n(c),u=n(0);t.a={init:i,setTelemetry:s,reqStart:r,clear:a}},61:function(e,t,n){"use strict";var i=n(62),s=n(63),r={entities:{},timestamp:0,activeDevicesID:[]};t.a={namespaced:!0,state:r,actions:i.a,mutations:s.a}},62:function(e,t,n){"use strict";function i(e){var t=e.state,n=e.commit,i=e.rootState;n("reqStart");var s={count:10,reverse:!0,filter:"position.latitude,position.longitude",from:t.timestamp+1||0};return!(!i.token||!t.activeDevicesID.length)&&c.a.http.get(c.a.config.flespiServer+"/registry/devices/"+t.activeDevicesID+"/messages",{params:{data:a()(s)}}).then(function(e){return e.json()}).then(function(e){n("reqSuccessful",e)}).catch(function(e){n("reqFailed",e,{root:!0})})}function s(e,t){var n=e.state,i=e.commit,s=e.rootState;i("reqStart");var r={count:10,reverse:!0,filter:"position.latitude,position.longitude",to:n.timestamp||0};return n.entities[t]||c.a.set(n.entities,t,[]),!!s.token&&c.a.http.get(c.a.config.flespiServer+"/registry/devices/"+t+"/messages",{params:{data:a()(r)}}).then(function(e){return e.json()}).then(function(e){i("reqSuccessful",e)}).catch(function(e){i("reqFailed",e)})}var r=n(33),a=n.n(r),c=n(0);t.a={get:i,getHistoryByDeviceID:s}},63:function(e,t,n){"use strict";function i(e){}function s(e,t){var n=t.result;e.activeDevicesID.forEach(function(t){var i=n.filter(function(e){return e.device_id===t});if(!i.length)return e.entities[t]||v.a.set(e.entities,t,[]),!1;var s=e.entities[t]||[];v.a.set(e.entities,t,[].concat(u()(i),u()(s)).slice(0,10))}),v.a.set(e,"timestamp",parseInt(e.activeDevicesID.reduce(function(t,n){return e.entities[n].length&&e.entities[n][0].timestamp>t?e.entities[n][0].timestamp:t},0)))}function r(e){e.activeDevicesID.length&&(v.a.set(e,"entities",{}),v.a.set(e,"activeDevicesID",[]),v.a.set(e,"timestamp",0))}function a(e,t){v.a.delete(e.entities,t)}function c(e,t){v.a.set(e,"activeDevicesID",t)}var o=n(64),u=n.n(o),v=n(0);t.a={reqStart:i,reqSuccessful:s,clear:r,clearByID:a,setActiveDevicesID:c}},85:function(e,t){},87:function(e,t){},88:function(e,t,n){function i(e){n(89)}var s=n(29)(n(90),n(91),i,null,null);e.exports=s.exports},89:function(e,t){},90:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={}},91:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"q-app"}},[n("router-view")],1)},staticRenderFns:[]}}},[34]);