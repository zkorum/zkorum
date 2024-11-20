/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: "hash" | "history" | "abstract" | undefined;
    VUE_ROUTER_BASE: string | undefined;
    API_BASE_URL: string;
    VITE_BACK_DID: string;
    USE_DUMMY_ACCESS: "true" | "false";
  }
}
