import { defineConfig } from "vite";
import { ValidateEnv } from "@julr/vite-plugin-validate-env";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
export default defineConfig({
    build: {
        chunkSizeWarningLimit: 10000
    },
    plugins: [
        react(),
        VitePWA({
            strategies: "injectManifest",
            injectManifest: {
                injectionPoint: undefined,
                maximumFileSizeToCacheInBytes: 10000,
            },
            registerType: "autoUpdate",
            injectRegister: null,
            devOptions: {
                enabled: true,
                type: "classic",
                navigateFallbackAllowlist: [/^index.html$/],
            },
            manifest: {
                name: "ZKorum",
                short_name: "ZKorum",
                description: "ZKorum - Break Barriers, Build Understandings",
                id: "/feed/",
                start_url: "/feed/?utm_source=pwa_install/",
                background_color: "#00275b",
                theme_color: "#00275b",
                icons: [
                    {
                        src: "icons/icon-128x128.png?dummy=preventcache",
                        sizes: "128x128",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "icons/icon-128x128-maskable.png?dummy=preventcache",
                        sizes: "128x128",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "icons/icon-192x192.png?dummy=preventcache",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "icons/icon-192x192-maskable.png?dummy=preventcache",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "icons/icon-256x256.png?dummy=preventcache",
                        sizes: "256x256",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "icons/icon-256x256-maskable.png?dummy=preventcache",
                        sizes: "256x256",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "icons/icon-384x384.png?dummy=preventcache",
                        sizes: "384x384",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "icons/icon-384x384-maskable.png?dummy=preventcache",
                        sizes: "384x384",
                        type: "image/png",
                        purpose: "maskable"
                    },
                    {
                        src: "icons/icon-512x512.png?dummy=preventcache",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "icons/icon-512x512-maskable.png?dummy=preventcache",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },
        }),
        svgr(),
        checker({
            typescript: true,
        }),
        ValidateEnv(),
        tsconfigPaths(),
    ],
    // The below config is for initializeWasm to work: https://stackoverflow.com/a/70719923/11046178
    optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: "globalThis",
            },
            // Enable esbuild polyfill plugins
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                }),
            ],
        },
    },
});
