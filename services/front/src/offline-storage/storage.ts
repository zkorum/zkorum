import localforage from "localforage";
import type { SessionData } from "../reducers/session";

export interface OfflineStorageState {
  activeSessionEmail: string;
  sessions: { [email: string]: SessionData };
  // isLoggedIn: boolean;
}

export async function storeRedux(reduxStateToCache: OfflineStorageState) {
  await localforage.setItem("zkorum", reduxStateToCache);
}
