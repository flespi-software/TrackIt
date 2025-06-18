const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: 'devices/:devices', component: () => import('layouts/MainLayout.vue') }],
  },
  { path: '/token/:token', component: () => import('pages/Login.vue') },
  { path: '/login', component: () => import('pages/Login.vue') },
  { path: '/login/:token', component: () => import('pages/Login.vue') },
  { path: '/login/:token/devices/:devices', component: () => import('layouts/MainLayout.vue') },
  { path: '/token/:token/devices/:devices', component: () => import('layouts/MainLayout.vue') },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
