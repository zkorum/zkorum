/* eslint-disable */

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: "hash" | "history" | "abstract" | undefined;
    VUE_ROUTER_BASE: string | undefined;
    BASE_URL: string;
    BACK_PUBLIC_KEY: string;
    HANKO_API_URL: string;
    VITE_BACK_DID: string;
  }
}
