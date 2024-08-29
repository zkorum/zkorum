/* eslint-env node */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { configure } from "quasar/wrappers";
import { fileURLToPath } from "node:url";
import "dotenv/config"

export default configure((ctx) => {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ctx.modeName === "capacitor" ? ["i18n", "axios", "crypto", "capgo", "capacitor-storage"] : ["i18n", "axios", "crypto"],

    bin: {
      linuxAndroidStudio: "/home/nicobao/.local/bin/studio.sh",
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ["app.scss"],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      "roboto-font", // optional, you are not bound to it
      "mdi-v7", // optional, you are not bound to it
      "material-icons"
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ["es2022", "firefox115", "chrome115", "safari14"],
        node: "node20",
      },

      vueRouterMode: "history", // available values: 'hash', 'history'
      // vueRouterBase: '/feed/',
      // vueDevtools,
      // vueOptionsAPI: false,

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: "/feed",
      // analyze: true,
      env: {
        BASE_URL: ctx.dev
          ? ctx.modeName === "capacitor"
            ? "http://192.168.1.96:8080"
            : process.env.FRONTEND_DEV_BASE_URL
          : ctx.debug
            ? "https://staging1.zkorum.com"
            : "https://zkorum.com",
        BACK_PUBLIC_KEY:
          ctx.dev ?
            "a33d87ba094e5fb522459da31ef501eedff2ef6b672ed6668555a90e5d099f2f8ac9b428c6b05479aebd9febe64011d707e3e331a01fd32e7bcca2e90405132014d395dade3aa95f72420567c6d4e75a5c70478691d36aa54030f31d326f9414"
            : ctx.debug
              ? "a17f8e504a42e53d53ae5ff92a7ba592f8a290cd2a6ed590a32265189cad76dd970b36582a8faca1697711c2fb8560ed084387bcb367f2d90b69887a51e7f41746678d4fc893a53ee6c7a2427b5bb277c6a35670530fbddfcddd1ce131b34288"
              : "94dbc0cc2cc457d9fc23823d7bbb46f3a59f5ec5062628147c89aabcef565593858ffb4f2897c2b8fc2336de2f84dab00eb1b91675e0e89ca18c37b29fde190f266ab2592caf88276ea8fe0449d91b84a32adc95cd969fe266db462a75147352",
        // https://quasar.dev/quasar-cli-webpack/handling-process-env/#using-dotenv
        VITE_BACK_DID: ctx.dev ? "did:web:localhost%3A8080" : ctx.debug ? "https://staging1.zkorum.com" : "https://zkorum.com"
      },
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      // For some reasons, it does NOT work...
      // https://quasar.dev/quasar-cli-vite/handling-vite/#adding-folder-aliases
      // extendViteConf(viteConf, _invokeParams) {
      //   if (viteConf.resolve?.alias !== undefined) {
      //     Object.assign(viteConf.resolve.alias, {
      //       utils: path.join(__dirname, './src/utils'),
      //       api: path.join(__dirname, './src/api')
      //     })
      //   }
      // },
      viteVuePluginOptions: {
        // see https://docs.hanko.io/quickstarts/frontend/vue#configure-component-resolution
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("swiper-")
          }
        }
      },

      vitePlugins: [
        [
          "@intlify/unplugin-vue-i18n/vite",
          {
            // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
            // compositionOnly: false,

            // if you want to use named tokens in your Vue I18n messages, such as 'Hello {name}',
            // you need to set `runtimeOnly: false`
            // runtimeOnly: false,

            ssr: ctx.modeName === "ssr",

            // you need to set i18n resource including paths !
            include: [
              fileURLToPath(
                new URL("./src/i18n", import.meta.url)
              ),
            ],
          },
        ],
        [
          "vite-plugin-checker",
          {
            vueTsc: {
              tsconfigPath: "tsconfig.vue-tsc.json",
            },
            eslint: {
              lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"',
            },
          },
          { server: false },
        ],
        // create "The CJS build of Vite's Node API is deprecated. See https://vitejs.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details." warning
        ["vite-tsconfig-paths", {
          // projects: ['./tsconfig.json', '../../tsconfig.json'] // if you have multiple tsconfig files (e.g. in a monorepo)
        }],
      ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      // https: true
      open: true, // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {},

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ["BottomSheet"],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: "all",

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
    //   pwaServiceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    //   bexManifestFile: 'src-bex/manifest.json
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        "render", // keep this as last one
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      pwa: false,

      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!
      // will mess up SSR

      // pwaExtendGenerateSWOptions (cfg) {},
      // pwaExtendInjectManifestOptions (cfg) {}
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: "GenerateSW", // 'GenerateSW' or 'InjectManifest'
      // swFilename: 'sw.js',
      // manifestFilename: 'manifest.json'
      // extendManifestJson (json) {},
      // useCredentialsForManifestTag: true,
      // injectPwaMetaTags: false,
      // extendPWACustomSWConf (esbuildConf) {},
      // extendGenerateSWOptions (cfg) {},
      // extendInjectManifestOptions (cfg) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ["electron-preload"],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: "packager", // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: "@zkorum/agora",
      },
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (esbuildConf) {},
      // extendBexManifestJson (json) {},

      contentScripts: ["my-content-script"],
    },
  };
});
