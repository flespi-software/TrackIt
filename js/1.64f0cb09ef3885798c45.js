webpackJsonp([1],{Cdx3:function(M,i,N){var I=N("sB3e"),n=N("lktj");N("uqUo")("keys",function(){return function(M){return n(I(M))}})},MOhq:function(M,i,N){var I=N("kxFB");(M.exports=N("FZ+f")(!1)).push([M.i,"\n.row__wrapper {\n  height: 80px;\n}\n.login-page .login-back {\n  width: 100%;\n  height: 50vh;\n  overflow: hidden;\n  font-size: 8vmax;\n  background-image: url("+I(N("UUak"))+");\n  background-position: center 100px;\n  background-size: contain;\n  background-repeat: no-repeat;\n  background-color: #333;\n  color: rgba(255,255,255,0.9);\n}\n.login-page .login-back .login-code {\n  height: 50vh;\n  width: 80vw;\n  max-width: 600px;\n  background-image: url("+I(N("MGDR"))+");\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n  opacity: 0.8;\n  padding-top: 20vh;\n  font-size: 80%;\n}\n.login-page .login-card {\n  border-radius: 2px;\n  margin-top: -50px;\n  width: 80vw;\n  max-width: 600px;\n  padding: 25px;\n}\n.login-page .login-card > i {\n  font-size: 5rem;\n}\n",""])},P7ry:function(M,i,N){"use strict";Object.defineProperty(i,"__esModule",{value:!0});var I=N("Xxa5"),n=N.n(I),z=N("fZjL"),c=N.n(z),e=N("exGp"),t=N.n(e),j=N("Dd8w"),g=N.n(j),s=N("NYxO"),D={data:function(){return{token:"",offlineIntervalId:0,icons:{facebook:"mdi-facebook-box",google:"mdi-google-plus-box",live:"mdi-windows",github:"mdi-github-box",email:"mdi-at"}}},computed:g()({},Object(s.d)(["providers"]),{model:{get:function(){return this.token},set:function(M){this.token=M}}}),methods:g()({},Object(s.b)(["getLoginProviders"]),Object(s.c)(["setToken"]),{logIn:function(){var M=this;this.setToken(this.token),this.$nextTick(function(){M.$router.push("/")})},autoLogin:function(){var M=this;this.setToken(this.$route.params.token),setTimeout(function(){M.$router.push("/")},1e3)},checkHasToken:function(){var M=this,i=this.$q.cookies.get("X-Flespi-Token"),N=this.$q.localStorage.get.item("X-Flespi-Token");this.$route.params&&this.$route.params.token?this.autoLogin():N?(this.token=N,this.logIn()):i&&this.$q.dialog({title:"Confirm",message:"Do you want log in by token "+i+".",ok:!0,cancel:!0}).then(function(){M.token=i,M.logIn()}).catch(function(){})},openUrl:function(M,i){var N=this;window.addEventListener("message",function M(i){"string"==typeof i.data&&~i.data.indexOf("FlespiToken")&&(N.token=i.data,N.logIn(),window.removeEventListener("message",M))}),i=i||"auth";var I=void 0!==window.screenLeft?window.screenLeft:screen.left,n=void 0!==window.screenTop?window.screenTop:screen.top,z=(window.innerWidth?window.innerWidth:document.documentElement.clientWidth?document.documentElement.clientWidth:screen.width)/2-250+I,c=(window.innerHeight?window.innerHeight:document.documentElement.clientHeight?document.documentElement.clientHeight:screen.height)/2-300+n,e=window.open(M,i,"toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width=500, height=600, top="+c+", left="+z);window.focus&&e.focus()}}),watch:{$route:function(M){M.params&&M.params.token&&this.autoLogin()}},created:function(){var M=this;return t()(n.a.mark(function i(){return n.a.wrap(function(i){for(;;)switch(i.prev=i.next){case 0:if(M.$q.loading.hide(),M.checkHasToken(),c()(M.providers).length){i.next=5;break}return i.next=5,M.getLoginProviders();case 5:case"end":return i.stop()}},i,M)}))()}},o=N("XyMi");var u=function(M){N("Yl4c")},L=Object(o.a)(D,function(){var M=this,i=M.$createElement,I=M._self._c||i;return I("div",{staticClass:"login-page window-height window-width bg-light column items-center no-wrap"},[M.$q.platform.is.mobile?M._e():I("a",{attrs:{href:"https://github.com/flespi-software/TrackIt/",target:"_blank"}},[I("img",{staticStyle:{position:"absolute",top:"0",right:"0",border:"0",width:"149px",height:"149px"},attrs:{src:N("bpX+"),alt:"Fork me on GitHub"}})]),M._v(" "),M._m(0),M._v(" "),M.$route.params.token?I("div",[I("div",{staticClass:"login-card shadow-4 bg-white column items-center justify-center no-wrap"},[I("q-progress",{staticStyle:{width:"100%",height:"45px"},attrs:{indeterminate:"",color:"positive"}})],1)]):I("div",[I("div",{staticClass:"login-card shadow-4 bg-white column items-center justify-center no-wrap"},[I("p",{staticClass:"text-center"},[M._v("Track your devices on the map.")]),M._v(" "),I("div",{staticClass:"row full-width"},[I("div",{staticClass:"col-12 text-center"},M._l(M.providers,function(i,N){return I("q-icon",{key:N,staticClass:"cursor-pointer",attrs:{size:"3.5rem",name:M.icons[N]},nativeOn:{click:function(I){M.openUrl(i,N)}}})}))])])])])},[function(){var M=this.$createElement,i=this._self._c||M;return i("div",{staticClass:"login-back flex items-center justify-center"},[i("div",{staticClass:"login-code flex items-center justify-center"},[this._v("\n      Track it!\n    ")])])}],!1,u,null,null);i.default=L.exports},UUak:function(M,i){M.exports="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDIxLjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9ItCg0LXQttC40Lxf0LjQt9C+0LvRj9GG0LjQuCIKCSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDEwNzEgNTM2LjA4OTIiCgkgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTA3MSA1MzYuMDg5MjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPgoJLnN0MHtvcGFjaXR5OjAuNzt9Cgkuc3Qxe2ZpbGw6bm9uZTtzdHJva2U6I0ZGRkZGRjtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQo8L3N0eWxlPgo8ZyBjbGFzcz0ic3QwIj4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNDI3LjU4ODgsNDcwLjAyOTQgNDI3LjU4ODgsNDcwLjAyOTQgMzgzLjM2MDUsMzk2LjY2MiAyNTAuNjY2OCw1MDYuNzYzOSAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjM4My4zNjA1LDM5Ni42NjIgMjY3LjY5MzcsNDA3Ljg4NjMgMjUwLjY2NjgsNTA2Ljc2MzkgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIyNTAuNjY2OCw1MDYuNzYzOSAzNTAuODQ1MSw1MjguMjA0IDQyNy41ODg4LDQ3MC4wMjk0IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMzUwLjE1NTUsMjI5LjYxMzggMTY5LjMwNTgsMTc3LjM4MzIgMzIyLjU5NzQsMzM5LjY0NTggCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIzNTAuMTU1NSwyMjkuNjEzOCAzMjIuNTk3NCwzMzkuNjQ1OCAzODMuMzYwNSwzOTYuNjYyIDM4OC4wNTU0LDMzNS40NjUzIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMjY3LjY5MzcsNDA3Ljg4NjMgMzgzLjM2MDUsMzk2LjY2MiAzMjIuNTk3NCwzMzkuNjQ1OCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9Ijc3Ni41OTI2LDQwMy4xMDI2IDY4My44MjY0LDQ2Ni4zNDUzIDY3My44MDE4LDUyNC4xMDExIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iODIxLjE4OTksMzE1Ljk2NDcgNzU5LjU2OTIsMTc3LjQ4NTcgNzIyLjQyNjEsMjMxLjU3NDcgCSIvPgoJPGxpbmUgY2xhc3M9InN0MSIgeDE9Ijc3Ni41OTI2IiB5MT0iNDAzLjEwMjYiIHgyPSI4MjEuMTg5OSIgeTI9IjMxNS45NjQ3Ii8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjU0NC42NDIzLDI4MS4yODE2IDU0NC42NDIzLDI4MS4yODE2IDY4MC4zMzAzLDM0Ny4xMDE2IDcyMi40MjYxLDIzMS41NzQ3IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNTEyLjIzMjEsMzk2Ljc0NjUgNjgzLjgyNjQsNDY2LjM0NTMgNTQ0LjY0MjMsMjgxLjI4MTYgNTEyLjIzMjEsMzk2Ljc0NjUgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI1NDQuNjQyMywyODEuMjgxNiAzODguMDU1NCwzMzUuNDY1MyA1MTIuMjMyMSwzOTYuNzQ2NSAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjQyNy41ODg4LDQ3MC4wMjk0IDY4MC4zMzAzLDM0Ny4xMDE2IDUxMi4yMzIxLDM5Ni43NDY1IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNjQzLjk3ODQsMjA5LjQ3MzUgNTE2LjEyMTIsMC41IDUxNi42ODI0LDE4Ni44NTg0IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNTE2LjEyMTIsMC41IDQwNS43OTA5LDE1My4wOTc2IDUxNi42ODI0LDE4Ni44NTg0IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNTE2LjY4MjQsMTg2Ljg1ODQgNTQ0LjY0MjMsMjgxLjI4MTYgNjQzLjk3ODQsMjA5LjQ3MzUgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIzNTAuMTU1NSwyMjkuNjEzOCAzODguMDU1NCwzMzUuNDY1MyA1MTYuNjgyNCwxODYuODU4NCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjM4OC4wNTU0LDMzNS40NjUzIDU0NC42NDIzLDI4MS4yODE2IDUxNi42ODI0LDE4Ni44NTg0IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iOTMyLjU2NTgsNDk1LjU0MzEgOTEyLjQ4OTIsMTk5LjY2ODggODc1LjYzNCwzNzAuMjgzIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iOTEyLjQ4OTIsMTk5LjY2ODggODIxLjE4OTksMzE1Ljk2NDcgODc1LjYzNCwzNzAuMjgzIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iOTE0LjcwOTUsNTM1LjU4OTIgOTMyLjU2NTgsNDk1LjU0MzEgODc1LjYzNCwzNzAuMjgzIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMjY3LjY5MzcsNDA3Ljg4NjMgMjQwLjI4OTgsMzI3LjQ1NTIgMTQ4LjQyNiwzNjIuMzMyNCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjI0MC4yODk4LDMyNy40NTUyIDE2OS4zMDU4LDE3Ny4zODMyIDE0OC40MjYsMzYyLjMzMjQgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIxNDguNDI2LDM2Mi4zMzI0IDI1MC42NjY4LDUwNi43NjM5IDI2Ny42OTM3LDQwNy44ODYzIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTIwLjUxNTEsNDY2LjM4MTUgMTk5LjE4NjksNTI0LjU2NDkgMTQ4LjQyNiwzNjIuMzMyNCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjU2NS4yNjE4LDQ5Mi43MDIxIDY4MC4zMzAzLDM0Ny4xMDE2IDUzMC4xMzQsNDY2LjM4MTUgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI2ODAuMzMwMywzNDcuMTAxNiA0MjcuNTg4OCw0NzAuMDI5NCA1MzAuMTM0LDQ2Ni4zODE1IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMzUwLjg0NTEsNTI4LjIwNCA0MjcuNTg4OCw0NjkuODg5OCA1MzAuMTM0LDQ2Ni4zODE1IDU2NS4yNjE4LDQ5Mi41NjYgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIzODMuMzYwNSwzOTYuNjYyIDUxMi4yMzIxLDM5Ni43NDY1IDM4OC4wNTU0LDMzNS40NjUzIAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNDI3LjU4ODgsNDY5Ljg4OTggMzgzLjM2MDUsMzk2LjY2MiA1MTIuMjMyMSwzOTYuNzQ2NSAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjYwOS45NTksMzY3LjgzNTEgNjgwLjMzMDMsMzQ3LjEwMTYgNTQ0LjY0MjMsMjgxLjI4MTYgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI3MjIuNDI2MSwyMzEuNTc0NyA3NzYuNTkyNiw0MDMuMTAyNiA4MjEuMTg5OSwzMTUuOTY0NyAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjY3My44MDE4LDUyNC4xMDExIDgxMC4wNzU0LDQzNS4yMjA1IDc3Ni41OTI2LDQwMy4xMDI2IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNjgzLjgyNjQsNDY2LjM0NTMgNTY1LjI2MTgsNDkyLjU2NiA2NzMuODAxOCw1MjQuMTAxMSAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjY4MC4zMzAzLDM0Ny4xMDE2IDU2NS4yNjE4LDQ5Mi41NjYgNjgzLjgyNjQsNDY2LjM0NTMgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI3MjIuNDI2MSwyMzEuNTc0NyA2ODAuMzMwMywzNDcuMTAxNiA2ODMuODI2NCw0NjYuMzQ1MyA3NzYuNTkyNiw0MDMuMTAyNiAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjI0MC4yODk4LDMyNy40NTUyIDI2Ny42OTM3LDQwNy44ODYzIDMyMi41OTc0LDMzOS42NDU4IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMjQwLjI4OTgsMzI3LjQ1NTIgMTY5LjMwNTgsMTc3LjM4MzIgMzIyLjU5NzQsMzM5LjY0NTggCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSIxNjkuMzA1OCwxNzcuMzgzMiA4OS4wODQzLDM4OS45MDc5IDE0OC40MjYsMzYyLjMzMjQgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI4OS4wODQzLDM4OS45MDc5IDAuNSw0MzIuOTU3IDYwLjQwMjksNDcwLjAyOTQgMTQ4LjQyNiwzNjIuMzMyNCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjY0My45Nzg0LDIwOS40NzM1IDc1OS41NjkyLDE3Ny40ODU3IDcyMi40MjYxLDIzMS41NzQ3IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iNDA1Ljc5MDksMTUzLjA5NzYgMzUwLjE1NTUsMjI5LjYxMzggNTE2LjY4MjQsMTg2Ljg1ODQgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI1NDQuNjQyMywyODEuMjgxNiA2NDMuOTc4NCwyMDkuNDczNSA3MjIuNDI2MSwyMzEuNTc0NyAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9Ijg3NS42MzQsMzcwLjI4MyA3NzYuNTkyNiw0MDMuMTAyNiA5MTQuNzA5NSw1MzUuNTg5MiAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjgyMS4xODk5LDMxNS45NjQ3IDc3Ni41OTI2LDQwMy4xMDI2IDg3NS42MzQsMzcwLjI4MyAJIi8+Cgk8Zz4KCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjAuNSw0MzIuOTU3IDEyNC41NDIyLDI5NC41MDM4IDg5LjA4NDMsMzg5LjkwNzkgCQkiLz4KCQk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjE3LjgwMzcsNDEzLjY0MjUgNTAuMTY5OCwyNjAuNCA3Ny43NTA0LDM0Ny43OTM4IAkJIi8+CgkJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI1MC4xNjk4LDI2MC40IDEyNC41NDIyLDI5NC41MDM4IDc3Ljc1MDQsMzQ3Ljc5MzggCQkiLz4KCTwvZz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTk5LjE4NjksNTI0LjU2NDkgMjUwLjY2NjgsNTA2Ljc2MzkgMTQ4LjQyNiwzNjIuMzMyNCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjYwLjQwMjksNDcwLjAyOTQgMTIwLjUxNTEsNDY2LjM4MTUgMTQ4LjQyNiwzNjIuMzMyNCAJIi8+Cgk8cG9seWdvbiBjbGFzcz0ic3QxIiBwb2ludHM9IjY5Ni40NTcyLDUxMC45NjY4IDc3Mi44MTksNTM1LjUxODYgODEwLjA3NTQsNDM1LjIyMDUgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI3NzIuODE5LDUzNS41MTg2IDgzMy4xMjI3LDUwOC42ODQzIDgxMC4wNzU0LDQzNS4yMjA1IAkiLz4KCTxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iODMzLjEyMjcsNTA4LjY4NDMgOTE0LjcwOTUsNTM1LjU4OTIgODEwLjc1MTQsNDM1Ljg2ODkgCSIvPgoJPHBvbHlnb24gY2xhc3M9InN0MSIgcG9pbnRzPSI5MzIuNTY1OCw0OTUuNTQzMSAxMDcwLjUsNTE4LjU1NzEgOTEyLjQ4OTIsMTk5LjY2ODggCSIvPgo8L2c+Cjwvc3ZnPgo="},Yl4c:function(M,i,N){var I=N("MOhq");"string"==typeof I&&(I=[[M.i,I,""]]),I.locals&&(M.exports=I.locals);(0,N("rjj0").default)("26f39988",I,!0,{})},"bpX+":function(M,i,N){M.exports=N.p+"img/right-graphite@2x.f2e09a9.png"},fZjL:function(M,i,N){M.exports={default:N("jFbC"),__esModule:!0}},jFbC:function(M,i,N){N("Cdx3"),M.exports=N("FeBl").Object.keys},uqUo:function(M,i,N){var I=N("kM2E"),n=N("FeBl"),z=N("S82l");M.exports=function(M,i){var N=(n.Object||{})[M]||Object[M],c={};c[M]=i(N),I(I.S+I.F*z(function(){N(1)}),"Object",c)}}});