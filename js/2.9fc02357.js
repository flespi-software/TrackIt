(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([[2],{"013f":function(t,e,i){"use strict";i.r(e);var n=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{staticClass:"login-page window-height window-width bg-light column items-center no-wrap"},[t.$q.platform.is.mobile&&t.$q.platform.within.iframe?t._e():i("a",{attrs:{href:"https://github.com/flespi-software/TrackIt/",target:"_blank"}},[i("img",{staticStyle:{position:"absolute",top:"0",right:"0",border:"0",width:"149px",height:"149px"},attrs:{src:"right-graphite@2x.png",alt:"Fork me on GitHub"}})]),t._m(0),t.$route.params.token?i("div",[i("div",{staticClass:"login-card shadow-4 bg-white column items-center justify-center no-wrap"},[i("q-circular-progress",{staticStyle:{width:"100%",height:"45px"},attrs:{indeterminate:"",color:"positive"}})],1)]):i("div",[i("div",{staticClass:"login-card shadow-4 bg-white column items-center justify-center no-wrap"},[i("p",{staticClass:"text-center"},[t._v("Track your devices on the map.")]),i("div",{staticClass:"row full-width"},[i("div",{staticClass:"col-12 text-center"},[i("q-btn",{attrs:{icon:"mdi-account-circle",color:"red-7",rounded:"",label:"login / register",size:"lg"},on:{click:function(e){return t.openWindow(t.$authHost+"/login/#/providers")}}})],1)])])])])},o=[function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{staticClass:"login-back flex items-center justify-center"},[i("div",{staticClass:"login-code flex items-center justify-center"},[t._v("\n      Track it!\n    ")])])}],s=i("ded3"),r=i.n(s),a=(i("5319"),i("2f62")),c=i("ef44"),h={data(){return{token:"",offlineIntervalId:0,icons:{facebook:"mdi-facebook-box",google:"mdi-google-plus-box",live:"mdi-windows",github:"mdi-github-box",email:"mdi-at"}}},computed:{model:{get(){return this.token},set(t){this.token=t}}},methods:r()(r()(r()({},Object(a["c"])(["setRegions","setCurrentRegion","setToken"])),Object(a["b"])(["initConnection"])),{},{logIn(t){this.initConnection({token:this.token,region:t}).then((()=>{this.$nextTick((()=>{this.$router.push("/")}))}))},autoLogin(){this.initConnection({token:this.$route.params.token}).then((()=>{this.$router.push("/")}))},checkHasToken(){const t=Object(c["a"])({store:this.$q.sessionStorage,storeName:this.$store.state.storeName,name:"token"}),e=Object(c["a"])({store:this.$q.sessionStorage,storeName:this.$store.state.storeName,name:"region"});return this.$route.params&&this.$route.params.token?(this.autoLogin(),!0):!!t&&(this.token=t,this.logIn(e),!0)},openWindow(t,e){e=e||"auth";const i=500,n=600,o=void 0!==window.screenLeft?window.screenLeft:screen.left,s=void 0!==window.screenTop?window.screenTop:screen.top,r=window.innerWidth?window.innerWidth:document.documentElement.clientWidth?document.documentElement.clientWidth:screen.width,a=window.innerHeight?window.innerHeight:document.documentElement.clientHeight?document.documentElement.clientHeight:screen.height,c=r/2-i/2+o,h=a/2-n/2+s,l=window.open(t,e,"toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width="+i+", height="+n+", top="+h+", left="+c);window.focus&&l.focus()},regionInitFromAuth(t){this.setRegions({[t.name]:t}),this.setCurrentRegion(t),this.$connector.setRegion(t)}}),watch:{$route(t){t.params&&t.params.token&&this.autoLogin()}},created(){if(!this.checkHasToken()){const t=e=>{if("string"===typeof e.data&&~e.data.indexOf("FlespiLogin|token:")){let i=e.data;i=i.replace("FlespiLogin|token:",""),i=JSON.parse(i),this.token=i.token,this.regionInitFromAuth(i.region),this.setToken(i.token),this.$router.push("/"),window.removeEventListener("message",t)}};window.addEventListener("message",t)}}},l=h,d=(i("1139"),i("2877")),u=i("9c40"),g=i("58ea"),m=i("eebe"),w=i.n(m),p=Object(d["a"])(l,n,o,!1,null,null,null);e["default"]=p.exports;w()(p,"components",{QBtn:u["a"],QCircularProgress:g["a"]})},1139:function(t,e,i){"use strict";i("82e1")},"82e1":function(t,e,i){}}]);