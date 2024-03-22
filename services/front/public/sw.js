/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */

// no-op sw to fix crazy issues with stale pwa...
// https://stackoverflow.com/a/38980776/11046178
self.addEventListener("install", () => {
    // Skip over the "waiting" lifecycle state, to ensure that our
    // new service worker is activated immediately, even if there's
    // another tab open controlled by our older service worker code.
    self.skipWaiting();
});

const manifest = self.__WB_MANIFEST; // to avoid build issues
