(function(e){function t(t){for(var o,a,r=t[0],c=t[1],l=t[2],u=0,d=[];u<r.length;u++)a=r[u],Object.prototype.hasOwnProperty.call(i,a)&&i[a]&&d.push(i[a][0]),i[a]=0;for(o in c)Object.prototype.hasOwnProperty.call(c,o)&&(e[o]=c[o]);f&&f(t);while(d.length)d.shift()();return s.push.apply(s,l||[]),n()}function n(){for(var e,t=0;t<s.length;t++){for(var n=s[t],o=!0,a=1;a<n.length;a++){var r=n[a];0!==i[r]&&(o=!1)}o&&(s.splice(t--,1),e=c(c.s=n[0]))}return e}var o={},a={3:0},i={3:0},s=[];function r(e){return c.p+"js/"+({}[e]||e)+"."+{1:"68d76b10",2:"9fc02357",4:"0638e005"}[e]+".js"}function c(t){if(o[t])return o[t].exports;var n=o[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,c),n.l=!0,n.exports}c.e=function(e){var t=[],n={1:1,2:1};a[e]?t.push(a[e]):0!==a[e]&&n[e]&&t.push(a[e]=new Promise((function(t,n){for(var o="css/"+({}[e]||e)+"."+{1:"9a4249d7",2:"3872dde2",4:"31d6cfe0"}[e]+".css",i=c.p+o,s=document.getElementsByTagName("link"),r=0;r<s.length;r++){var l=s[r],u=l.getAttribute("data-href")||l.getAttribute("href");if("stylesheet"===l.rel&&(u===o||u===i))return t()}var d=document.getElementsByTagName("style");for(r=0;r<d.length;r++){l=d[r],u=l.getAttribute("data-href");if(u===o||u===i)return t()}var f=document.createElement("link");f.rel="stylesheet",f.type="text/css",f.onload=t,f.onerror=function(t){var o=t&&t.target&&t.target.src||i,s=new Error("Loading CSS chunk "+e+" failed.\n("+o+")");s.code="CSS_CHUNK_LOAD_FAILED",s.request=o,delete a[e],f.parentNode.removeChild(f),n(s)},f.href=i;var p=document.getElementsByTagName("head")[0];p.appendChild(f)})).then((function(){a[e]=0})));var o=i[e];if(0!==o)if(o)t.push(o[2]);else{var s=new Promise((function(t,n){o=i[e]=[t,n]}));t.push(o[2]=s);var l,u=document.createElement("script");u.charset="utf-8",u.timeout=120,c.nc&&u.setAttribute("nonce",c.nc),u.src=r(e);var d=new Error;l=function(t){u.onerror=u.onload=null,clearTimeout(f);var n=i[e];if(0!==n){if(n){var o=t&&("load"===t.type?"missing":t.type),a=t&&t.target&&t.target.src;d.message="Loading chunk "+e+" failed.\n("+o+": "+a+")",d.name="ChunkLoadError",d.type=o,d.request=a,n[1](d)}i[e]=void 0}};var f=setTimeout((function(){l({type:"timeout",target:u})}),12e4);u.onerror=u.onload=l,document.head.appendChild(u)}return Promise.all(t)},c.m=e,c.c=o,c.d=function(e,t,n){c.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},c.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.t=function(e,t){if(1&t&&(e=c(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(c.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)c.d(n,o,function(t){return e[t]}.bind(null,o));return n},c.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return c.d(t,"a",t),t},c.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},c.p="",c.oe=function(e){throw console.error(e),e};var l=window["webpackJsonp"]=window["webpackJsonp"]||[],u=l.push.bind(l);l.push=t,l=l.slice();for(var d=0;d<l.length;d++)t(l[d]);var f=u;s.push([0,0]),n()})({0:function(e,t,n){e.exports=n("2f39")},1:function(e,t){},2:function(e,t){},"2f39":function(e,t,n){"use strict";n.r(t);n("5319"),n("9f29"),n("7d6e"),n("e54f"),n("62f2"),n("7e6d");var o=n("2b0e"),a=n("b05d"),i=n("4d5a"),s=n("e359"),r=n("9404"),c=n("09e3"),l=n("9989"),u=n("65c6"),d=n("6ac5"),f=n("9c40"),p=n("0016"),v=n("1c1c"),g=n("66e5"),m=n("4074"),h=n("0170"),b=n("05c0"),y=n("3980"),w=n("24e8"),k=n("ddd8"),D=n("27f9"),O=n("3845"),Q=n("8f8e"),C=n("429b"),I=n("7460"),S=n("adad"),N=n("823b"),j=n("9564"),P=n("4e73"),T=n("58ea"),E=n("cf57"),L=n("c1d0"),$=n("8572"),x=n("7bbf"),q=n("b047"),_=n("b498"),A=n("f09f"),R=n("eb85"),M=n("4b7e"),F=n("a370"),B=n("6a67"),H=n("714f"),J=n("7f67"),V=n("f449"),z=n("75c3"),K=n("2a19"),U=n("f508"),G=n("18d6"),W=n("a639"),X=n("436b");o["default"].use(a["a"],{config:{},components:{QLayout:i["a"],QHeader:s["a"],QDrawer:r["a"],QPageContainer:c["a"],QPage:l["a"],QToolbar:u["a"],QToolbarTitle:d["a"],QBtn:f["a"],QIcon:p["a"],QList:v["a"],QItem:g["a"],QItemSection:m["a"],QItemLabel:h["a"],QTooltip:b["a"],QResizeObserver:y["a"],QDialog:w["a"],QSelect:k["a"],QInput:D["a"],QKnob:O["a"],QCheckbox:Q["a"],QTabs:C["a"],QTab:I["a"],QTabPanels:S["a"],QTabPanel:N["a"],QToggle:j["a"],QMenu:P["a"],QCircularProgress:T["a"],QSpinnerGears:E["a"],QSlider:L["a"],QField:$["a"],QRange:x["a"],QChip:q["a"],QColor:_["a"],QCard:A["a"],QSeparator:R["a"],QCardActions:M["a"],QCardSection:F["a"],QBtnToggle:B["a"]},directives:{Ripple:H["a"],ClosePopup:J["a"],TouchHold:V["a"],TouchPan:z["a"]},plugins:{Notify:K["a"],Loading:U["a"],LocalStorage:G["a"],SessionStorage:W["a"],Dialog:X["a"]}});var Y=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"q-app"}},[n("router-view"),n("offline",{attrs:{logo:"trackit.png"}})],1)},Z=[],ee=function(){var e=this,t=e.$createElement,n=e._self._c||t;return e.$store.state.offline||e.$store.state.socketOffline?n("div",{staticClass:"offline-page window-height window-width bg-light column items-center no-wrap"},[n("div",{staticClass:"offline-back"},[n("div",{staticClass:"offline-code"}),n("div",{staticClass:"offline-line"},e._l(Array(20),(function(t){return n("span",{key:t},[e._v("offline")])})),0)])]):e._e()},te=[],ne={name:"offline",data(){return{intervalId:0}},created(){this.intervalId=setInterval((()=>{this.$store.dispatch("checkConnection")}),5e3)}},oe=ne,ae=(n("85c2"),n("2877")),ie=Object(ae["a"])(oe,ee,te,!1,null,null,null),se=ie.exports,re={name:"App",components:{Offline:se}},ce=re,le=Object(ae["a"])(ce,Y,Z,!1,null,null,null),ue=le.exports,de=n("2f62"),fe=(n("ddb0"),n("13d5"),n("9b02")),pe=n.n(fe);async function ve({state:e,commit:t}){t("reqStart");try{if(e.token){const e=await o["default"].connector.poolDevices((e=>{t("setDevices",e)}),((e,n)=>{t("updateDevices",{type:e,device:n})}));return async()=>{await o["default"].connector.poolDevicesStop(e)}}}catch(n){t("reqFailed",n)}}async function ge({state:e,commit:t}){try{const n=await o["default"].connector.http.external.get(`./icons/favicon-16x16.png?_=${(new Date).getTime()}`);200===n.status&&e.offline&&t("setOfflineFlag",!1)}catch(n){0,e.offline||t("setOfflineFlag",!0)}}async function me({commit:e,state:t},n){let a=(new Date).setHours(0,0,0,0),i=a+86399999;if(t.token){const s=n||t.activeDevicesID.join(",");let r;if(s){const t=await o["default"].connector.gw.getDevicesTelemetry(s,"position.latitude,position.longitude"),n=t.data;n.errors&&postMessage.errors.forEach((t=>{e("addError",t.reason)}));const a=Math.max(...n.result.reduce(((e,t)=>(e.push(t.telemetry&&t.telemetry["position.latitude"]?Math.floor(1e3*t.telemetry["position.latitude"].ts):0),e.push(t.telemetry&&t.telemetry["position.longitude"]?Math.floor(1e3*t.telemetry["position.longitude"].ts):0),e)),[]));r=a||Date.now()}else r=Date.now();a=new Date(r).setHours(0,0,0,0),i=a+86399999}return[a,i]}async function he({commit:e,state:t},n){if(!t.token)return;const a=await o["default"].connector.gw.getDevicesTelemetry(n,"all"),i=a.data;i.errors&&postMessage.errors.forEach((t=>{e("addError",t.reason)}));const s=i&&i.result[0]&&i.result[0].telemetry?i.result[0].telemetry:{},r=Object.keys(s);if(!r.length)return!1;const c=r.reduce(((e,t)=>("position"===t||(e[t]=s[t].value),e)),{});c["x-flespi-inited-by-telemetry"]=!0,e(`messages/${n}/setHistoryMessages`,[c])}async function be({state:e,commit:t}){try{"undefined"!==typeof e.isLoading&&o["default"].set(e,"isLoading",!0);const n=await o["default"].connector.http.get("/auth/regions");let a=pe()(n,"data.result",[]),i=null;a=a.reduce(((e,t)=>(t.default&&(i=t),e[t.name]=t,e)),{}),i&&t("setCurrentRegion",i),t("setRegions",a)}catch(n){t("reqFailed",n),"undefined"!==typeof e.isLoading&&o["default"].set(e,"isLoading",!1)}}async function ye({state:e,commit:t},{region:n,token:a}){try{"undefined"!==typeof e.isLoading&&o["default"].set(e,"isLoading",!0),e.regions||await be({state:e,commit:t}),n&&t("setCurrentRegion",e.regions[n]),o["default"].prototype.$flespiServer=e.currentRegion.rest,o["default"].prototype.$flespiSocketServer=`wss://${e.currentRegion["mqtt-ws"]}`,o["default"].prototype.$flespiCDN=e.currentRegion.cdn,o["default"].connector.setRegion(e.currentRegion),t("setToken",a)}catch(i){t("reqFailed",i),"undefined"!==typeof e.isLoading&&o["default"].set(e,"isLoading",!1)}}var we={poolDevices:ve,checkConnection:ge,getLastUpdatePosition:me,getInitDataByDeviceId:he,getRegions:be,initConnection:ye},ke=n("8c4f"),De=[{path:"/",component:()=>Promise.all([n.e(0),n.e(1)]).then(n.bind(null,"f241")),children:[{path:"devices/:devices",component:()=>Promise.all([n.e(0),n.e(1)]).then(n.bind(null,"f241"))}]},{path:"/token/:token",component:()=>Promise.all([n.e(0),n.e(2)]).then(n.bind(null,"013f"))},{path:"/login",component:()=>Promise.all([n.e(0),n.e(2)]).then(n.bind(null,"013f"))},{path:"/login/:token",component:()=>Promise.all([n.e(0),n.e(2)]).then(n.bind(null,"013f"))},{path:"/login/:token/devices/:devices",component:()=>Promise.all([n.e(0),n.e(1)]).then(n.bind(null,"f241"))},{path:"*",component:()=>Promise.all([n.e(0),n.e(4)]).then(n.bind(null,"e51e"))}];o["default"].use(ke["a"]);const Oe=new ke["a"]({mode:"hash",base:"",scrollBehavior:()=>({y:0}),routes:De});var Qe=Oe,Ce=n("ef44");function Ie(e){0}function Se(e,{type:t,payload:n}){const{result:a}=n;switch(t){case"postMessage":K["a"].create({message:`Post message to devices with IDs ${a} success`,type:"positive",icon:"alarm_add",timeout:2500,bgColor:"white"});break;default:JSON.stringify(e[t])!==JSON.stringify(a)&&o["default"].set(e,t,a)}}function Ne(e,t){if(JSON.stringify(e.devices)!==JSON.stringify(t.data.result)&&o["default"].set(e,"devices",t.data.result),!e.hasDevicesInit)if(e.activeDevicesID.length)e.activeDevicesID.forEach((n=>{t.data.result.filter((e=>e.id===n)).length||xe(e,n)})),qe(e);else{qe(e);const n=Object(Ce["a"])({store:G["a"],storeName:e.storeName,name:"active"});n&&n.length&&n.forEach((n=>{t.data.result.filter((e=>e.id===n)).length&&$e(e,n)}))}}function je(e,t){switch(t.type){case"created":e.devices.push(t.device);break;case"updated":e.devices.some(((n,o)=>n.id===t.device.id&&(e.devices[o]=Object.assign(e.devices[o],t.device),!0)));break;case"deleted":e.devices.some(((n,o)=>n.id===t.device.id&&(e.devices.splice(o,1),!0)));break}}function Pe(e,t){if(t.response&&t.response.status)switch(t.response.status){case 0:Te(e,!0),_e(e),o["default"].set(e,"token","");break;case 401:Le(e);break;default:t.response.data&&t.response.data.errors&&t.response.data.errors.length&&t.response.data.errors.forEach((t=>{Ae(e,t.reason)}))}else if(t.code&&t.message)switch(t.code){case 2:case 134:case 135:e.token&&Le(e),Ae(e,t.message);break}else Ae(e,t.message)}function Te(e,t){o["default"].set(e,"offline",t)}function Ee(e,t){let n=t.replace("FlespiToken ","");t&&n.match(/^[a-z0-9]+$/i)?(o["default"].connector.token=`FlespiToken ${n}`,Object(Ce["b"])({store:W["a"],storeName:e.storeName,name:"token",value:n})):(n="",o["default"].connector.token="",Le(e)),o["default"].set(e,"token",n)}function Le(e){Object(Ce["b"])({store:W["a"],storeName:e.storeName,name:"token",value:null}),o["default"].connector.token="",e.socketOffline&&Re(e,!1),o["default"].set(e,"token","")}function $e(e,t){e.hasDevicesInit&&!e.devices.filter((e=>e.id===t))[0].messages_ttl||(e.activeDevicesID.push(t),Object(Ce["b"])({store:G["a"],storeName:e.storeName,name:"active",value:e.activeDevicesID}),e.hasDevicesInit&&Qe.push(`/devices/${e.activeDevicesID.join(",")}`).catch((e=>{})))}function xe(e,t){const n=e.activeDevicesID.indexOf(t);e.activeDevicesID.splice(n,1),Object(Ce["b"])({store:G["a"],storeName:e.storeName,name:"active",value:e.activeDevicesID}),e.activeDevicesID.length?Qe.push(`/devices/${e.activeDevicesID.join(",")}`).catch((e=>{})):Qe.push("/").catch((e=>{}))}function qe(e){e.hasDevicesInit=!0}function _e(e){e.hasDevicesInit=!1,o["default"].set(e,"devices",[]),o["default"].set(e,"activeDevicesID",[])}function Ae(e,t){if(!e.token)return!1;K["a"].create({color:"negative",icon:"warning",message:`${t}`,timeout:1e3}),e.newNotificationCounter++,e.errors.push(t)}function Re(e,t){o["default"].set(e,"socketOffline",t)}function Me(e){o["default"].set(e,"errors",[])}function Fe(e,t){e.regions=t}function Be(e,t){e.currentRegion=t,Object(Ce["b"])({store:W["a"],storeName:e.storeName,name:"region",value:t.name})}function He(e){e.currentRegion=null,Object(Ce["b"])({store:W["a"],storeName:e.storeName,name:"region",value:null})}function Je(e){e.newNotificationCounter=0}function Ve(e,t){e.date=t}var ze={reqStart:Ie,reqSuccessful:Se,reqFailed:Pe,setToken:Ee,clearToken:Le,setActiveDevice:$e,unsetActiveDevice:xe,setDevicesInit:qe,unsetDevicesInit:_e,setOfflineFlag:Te,updateDevices:je,setDevices:Ne,setSocketOffline:Re,clearNotificationCounter:Je,addError:Ae,clearErrors:Me,setRegions:Fe,setCurrentRegion:Be,clearCurrentRegion:He,setDate:Ve},Ke={},Ue={namespaced:!0},Ge={messages:Ue};o["default"].use(de["a"]);const We={token:"",devices:[],activeDevicesID:[],hasDevicesInit:!1,offline:!1,socketOffline:!1,isLoading:!1,newNotificationCounter:0,errors:[],date:[0,0],regions:null,currentRegion:null,storeName:"flespi-trackit-settings"},Xe=new de["a"].Store({state:We,actions:we,mutations:ze,getters:Ke,modules:Ge});var Ye=Xe,Ze=async function(){const e="function"===typeof Ye?await Ye({Vue:o["default"]}):Ye,t="function"===typeof Qe?await Qe({Vue:o["default"],store:e}):Qe;e.$router=t;const n={router:t,store:e,render:e=>e(ue),el:"#q-app"};return{app:n,store:e,router:t}},et=n("a925"),tt={failed:"Action failed",success:"Action was successful"},nt={"en-us":tt};o["default"].use(et["a"]);const ot=new et["a"]({locale:"en-us",fallbackLocale:"en-us",messages:nt});var at=({app:e})=>{e.i18n=ot},it=n("553c"),st=n.n(it),rt=n("9224");let ct="",lt="";-1===window.location.host.indexOf("flespi.io")?(ct=`https://${window.location.hostname}:9005`,lt=`wss://${window.location.hostname}:9017`):-1!==window.location.pathname.indexOf("/trackit")&&(ct=`https://${window.location.host}`,lt=`wss://${window.location.host}`);const ut=-1===window.location.host.indexOf("flespi.io"),dt={protocolVersion:5,wsOptions:{objectMode:!1,perMessageDeflate:!0}},ft={socketConfig:{server:lt,clientId:`trackit-${rt["version"]}${ut?"-dev":""}-${Math.random().toString(16).substr(2,8)}`,mqttSettings:dt},httpConfig:ct?{server:ct}:void 0};var pt=({Vue:e,store:t})=>{e.prototype.$authHost=ct||"https://flespi.io",e.prototype.$flespiServer=ct||"https://flespi.io",e.use(st.a,ft),e.connector.socket.on("error",(e=>{t.commit("reqFailed",e)})),window&&window.addEventListener("beforeunload",(()=>{e.connector.socket.close(!0)}))};const vt="";async function gt(){const{app:e,store:t,router:n}=await Ze();let a=!1;const i=e=>{a=!0;const t=Object(e)===e?n.resolve(e).route.fullPath:e;window.location.href=t},s=window.location.href.replace(window.location.origin,""),r=[at,pt];for(let l=0;!1===a&&l<r.length;l++)if("function"===typeof r[l])try{await r[l]({app:e,router:n,store:t,Vue:o["default"],ssrContext:null,redirect:i,urlPath:s,publicPath:vt})}catch(c){return c&&c.url?void(window.location.href=c.url):void console.error("[Quasar] boot error:",c)}!0!==a&&new o["default"](e)}gt()},3:function(e,t){},4:function(e,t){},5:function(e,t){},6:function(e,t){},"7bae":function(e,t,n){},"7e6d":function(e,t,n){},"85c2":function(e,t,n){"use strict";n("7bae")},9224:function(e){e.exports=JSON.parse('{"name":"track-it","version":"1.4.1","description":"A simple application based on flespi.io and built with Quasar and Leaflet.js. Allows tracking different devices on the map, viewing telemetry messages for these devices.","productName":"TrackIt!","capacitorId":"","author":"Sergey Buntsevich <scarry92@yandex.ru>","private":true,"scripts":{"lint":"eslint --ext .js,.vue src","dev":"quasar dev -m spa","dev_local":"env NODE_LOCAL=local quasar dev -m spa","build":"quasar build -m spa","deploy":"rm -rf dist && npm run build && rm -rf deploy && mkdir deploy && cp -R dist/spa/* misc LICENSE package.json deploy && cp README.md deploy/README.md && node_modules/git-directory-deploy/bin/git-directory-deploy.sh -ddeploy -bgh-pages -rhttps://git.gurtam.net/flespi/frontend/TrackIt.git && rm -rf deploy && git push github gh-pages"},"dependencies":{"@quasar/extras":"^1.5.2","core-js":"^3.14.0","flespi-io-js":"github:flespi-software/flespi-io-js","leaflet":"^1.6.0","leaflet-geometryutil":"^0.10.0","leaflet.marker.slideto":"^0.2.0","leaflet.polyline.snakeanim":"^0.2.0","leaflet.polylinemeasure":"github:ppete2/Leaflet.PolylineMeasure#b85a4b9","lodash":"^4.17.21","moment":"^2.29.0","qtelemetry":"github:flespi-software/QTelemetry","quasar":"^1.15.20","qvirtualscroll":"github:flespi-software/QVirtualScroll","vue-i18n":"^8.15.4","vue-virtual-scroll-list":"^1.4.6"},"devDependencies":{"@quasar/app":"^2.2.10","babel-eslint":"^10.0.1","eslint":"^7.21.0","eslint-config-prettier":"^8.1.0","eslint-plugin-vue":"^7.7.0","eslint-webpack-plugin":"^2.4.0","git-directory-deploy":"^1.5.1"},"browserslist":["last 10 Chrome versions","last 10 Firefox versions","last 4 Edge versions","last 7 Safari versions","last 8 Android versions","last 8 ChromeAndroid versions","last 8 FirefoxAndroid versions","last 10 iOS versions","last 5 Opera versions"],"engines":{"node":">= 10.18.1","npm":">= 6.13.4","yarn":">= 1.21.1"}}')},ef44:function(e,t,n){"use strict";function o({store:e,storeName:t,name:n}){const o=e.getItem(t);return o&&o[n]}function a({store:e,storeName:t,name:n,value:o}){let a=e.getItem(t);a||(a={}),o?a[n]=o:delete a[n],e.set(t,a)}n.d(t,"a",(function(){return o})),n.d(t,"b",(function(){return a}))}});