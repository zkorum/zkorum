/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
export const BASE58_DID_PREFIX = "did:key:z";
export const WEB_DID_PREFIX = "did:web:";

// TODO: improve this validation
export const validateDidKey = (did: string) => {
  return did.startsWith(BASE58_DID_PREFIX);
};

// TODO: improve this validation
export const validateDidWeb = (did: string) => {
  return did.startsWith(WEB_DID_PREFIX);
};
