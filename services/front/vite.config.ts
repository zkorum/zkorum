import { defineConfig } from "vite";
import { ValidateEnv } from "@julr/vite-plugin-validate-env";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({ registerType: "autoUpdate" }),
        svgr(),
        checker({
            typescript: true,
        }),
        ValidateEnv(),
    ],
});
