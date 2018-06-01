
export default [
  {
    path: '/',
    component: () => import('layouts/Index'),
    children: [
      {
        path: 'devices/:devices',
        component: () => import('layouts/Index')
      }
    ]
  },
  { path: '/login', component: () => import('pages/Login') },
  { path: '/login/:token', component: () => import('pages/Login') },
  { path: '/login/:token/devices/:devices', component: () => import('layouts/Index') },

  // Always leave this last one
  { path: '*', component: () => import('pages/404') } // Not found
]
