export const VITE_BACK_BASE_URL = import.meta.env.PROD
    ? import.meta.env.VITE_BACK_BASE_URL_PROD
    : import.meta.env.VITE_BACK_BASE_URL_DEV;

export const VITE_BACK_DID = import.meta.env.PROD
    ? import.meta.env.VITE_BACK_DID_PROD
    : import.meta.env.VITE_BACK_DID_DEV;

export const VITE_BACK_PUBLIC_KEY = import.meta.env.PROD
    ? import.meta.env.VITE_BACK_PUBLIC_KEY_PROD
    : import.meta.env.VITE_BACK_PUBLIC_KEY_DEV;
