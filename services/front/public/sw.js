// Import the Workbox libraries
importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);

// Ensure that workbox is available
if (workbox) {
    // Use the workbox.routing.registerRoute method to register a route
    workbox.routing.registerRoute(
        // Define a RegExp pattern that matches the desired URLs
        new RegExp(".*"),
        // Use the workbox.strategies.networkFirst strategy
        new workbox.strategies.NetworkFirst()
    );

    // Add an event listener for the install event
    self.addEventListener("install", (event) => {
        // Skip waiting to immediately activate the service worker
        self.skipWaiting();
    });

    // Add an event listener for the activate event
    self.addEventListener("activate", (event) => {
        // Claim clients to activate all tabs immediately
        self.clients.claim();
    });
} else {
    console.error("Workbox not loaded!");
}
