/*
 * This file is picked up by the build system only
 * when building for PRODUCTION
 */

import { register } from 'register-service-worker'

register(process.env.SERVICE_WORKER_FILE, {
  ready () {
    console.log('App is being served from cache by a service worker.')
  },
  cached (registration) { // registration -> a ServiceWorkerRegistration instance
    console.log('Content has been cached for offline use.')
  },
  updated (registration) { // registration -> a ServiceWorkerRegistration instance
    if (confirm('The new version of TrackIt! is available. Refresh the page to update?')) {
      window.location.reload()
    }
  },
  offline () {
    console.log('No internet connection found. App is running in offline mode.')
  },
  error (err) {
    console.error('Error during service worker registration:', err)
  }
})

// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration
