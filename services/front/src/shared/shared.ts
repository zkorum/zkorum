/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
// Copyright ts-odd team
// Apache v2 License
// Extracted from: https://github.com/oddsdk/ts-odd/tree/f90bde37416d9986d1c0afed406182a95ce7c1d7
import localforage from "localforage";

/**
 * Is this browser supported?
 */
export async function isSupported(): Promise<boolean> {
  return (
    localforage.supports(localforage.INDEXEDDB) &&
    // Firefox in private mode can't use indexedDB properly,
    // so we test if we can actually make a database.
    ((await (() =>
      new Promise((resolve) => {
        const db = indexedDB.open("testDatabase");
        db.onsuccess = () => resolve(true);
        db.onerror = () => resolve(false);
      }))()) as boolean)
  );
}

export enum ProgramError {
  InsecureContext = "INSECURE_CONTEXT",
  UnsupportedBrowser = "UNSUPPORTED_BROWSER",
}
