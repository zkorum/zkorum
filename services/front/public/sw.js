/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "injectManifest"
 */

import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

self.skipWaiting();
clientsClaim();

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();
