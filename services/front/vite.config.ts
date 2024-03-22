import { defineConfig } from "vite";
import { ValidateEnv } from "@julr/vite-plugin-validate-env";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: "injectManifest",
            injectManifest: {
                injectionPoint: undefined,
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
                description: "ZKorum",
                theme_color: "#ffffff",
                icons: [
                    {
                        src: "icons/icon-128x128.png",
                        sizes: "128x128",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-256x256.png",
                        sizes: "256x256",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-384x384.png",
                        sizes: "384x384",
                        type: "image/png",
                    },
                    {
                        src: "icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
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
