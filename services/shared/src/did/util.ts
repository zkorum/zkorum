import { arrbufs } from "../common/index.js";

export const BASE58_DID_PREFIX = "did:key:z";
export const WEB_DID_PREFIX = "did:web:";

/**
 * Determines if an ArrayBuffer has a given indeterminate length-prefix.
 */
export const hasPrefix = (
  prefixedKey: ArrayBuffer,
  prefix: ArrayBuffer
): boolean => {
  return arrbufs.equal(prefix, prefixedKey.slice(0, prefix.byteLength));
};

// TODO: improve this validation
export const validateDidKey = (did: string) => {
  return did.startsWith(BASE58_DID_PREFIX);
};

// TODO: improve this validation
export const validateDidWeb = (did: string) => {
  return did.startsWith(WEB_DID_PREFIX);
};
