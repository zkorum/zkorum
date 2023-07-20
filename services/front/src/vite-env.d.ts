/// <reference types="vite/client" />

// This is necessary to get intellisense from LSP:
// TODO: this should be in sync with the zod config in vite.config.ts instead of copy-pasting manually...
// Maybe look into this plugin, though I don't want to rely on yet another plugin:
// https://github.com/Julien-R44/vite-plugin-validate-env
interface ImportMetaEnv {
  readonly VITE_BACK_BASE_URL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
