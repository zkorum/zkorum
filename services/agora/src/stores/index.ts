import { store } from "quasar/wrappers";
import { createPinia } from "pinia";
import { Router } from "vue-router";
import { PluginOptions, createPersistedStatePlugin } from "pinia-plugin-persistedstate-2";
import localforage from "localforage";
import { Dialog, Platform } from "quasar"
import { StateTree } from "pinia";
import {
  DataType,
  KeychainAccess,
  SecureStorage,
  StorageError,
  StorageErrorType,
} from "@zkorum/capacitor-secure-storage"
import { i18n } from "src/boot/i18n"
import { App } from "@capacitor/app"
import { nativeAuthenticate } from "@/utils/native/auth";

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module "pinia" {
  export interface PiniaCustomProperties {
    readonly router: Router;
  }
}

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

async function mobileGetItem(key: string): Promise<DataType | null> {
  try {
    return SecureStorage.get(key, true, true);
  } catch (error) {
    if (error instanceof StorageError) {
      switch (StorageErrorType[error.code]) {
      case "userNotAuthenticated": {
        try {
          await nativeAuthenticate();
          return mobileGetItem(key);
        } catch (error) {
          console.error("Fatal error while trying to authenticate user on mobile", error)
          Dialog.create({
            title: i18n.global.t("capacitorStorage.fatalError.title"),
            message: i18n.global.t("capacitorStorage.fatalError.message"),
            ok: i18n.global.t("capacitorStorage.fatalError.ok"),
          }).onOk(() => {
            App.exitApp();
          });
        }
      }
      case "secureLockScreenDisabled":
        //TODO: redirectToCreateSecureLockScreen()
        console.error("Secure Lock Screen Error while trying to access secure storage", error)
        Dialog.create({
          title: i18n.global.t("capacitorStorage.secureLockScreenError.title"),
          message: i18n.global.t("capacitorStorage.secureLockScreenError.message"),
          ok: i18n.global.t("capacitorStorage.secureLockScreenError.ok"),
        }).onOk(() => {
          App.exitApp();
        });
        throw error;
      default:
        console.error("Fatal error while trying to access secure storage", error)
        Dialog.create({
          title: i18n.global.t("capacitorStorage.fatalError.title"),
          message: i18n.global.t("capacitorStorage.fatalError.message"),
          ok: i18n.global.t("capacitorStorage.fatalError.ok"),
        }).onOk(() => {
          App.exitApp();
        });
        throw error;
      }
    } else {
      throw error;
    }
  }
}

async function mobileRemoveItem(key: string): Promise<void> {
  try {
    return SecureStorage.remove(key, true).then(() => { });
  } catch (error) {
    if (error instanceof StorageError) {
      switch (StorageErrorType[error.code]) {
      case "userNotAuthenticated": {
        try {
          await nativeAuthenticate();
          return mobileRemoveItem(key);
        } catch (error) {
          console.error("Fatal error while trying to authenticate user on mobile", error)
          Dialog.create({
            title: i18n.global.t("capacitorStorage.fatalError.title"),
            message: i18n.global.t("capacitorStorage.fatalError.message"),
            ok: i18n.global.t("capacitorStorage.fatalError.ok"),
          }).onOk(() => {
            App.exitApp();
          });
        }
      }
      case "secureLockScreenDisabled":
        //TODO: redirectToCreateSecureLockScreen()
        console.error("Secure Lock Screen Error while trying to access secure storage", error)
        Dialog.create({
          title: i18n.global.t("capacitorStorage.secureLockScreenError.title"),
          message: i18n.global.t("capacitorStorage.secureLockScreenError.message"),
          ok: i18n.global.t("capacitorStorage.secureLockScreenError.ok"),
        }).onOk(() => {
          App.exitApp();
        });
      default:
        console.error("Fatal error while trying to access secure storage", error)
        Dialog.create({
          title: i18n.global.t("capacitorStorage.fatalError.title"),
          message: i18n.global.t("capacitorStorage.fatalError.message"),
          ok: i18n.global.t("capacitorStorage.fatalError.ok"),
        }).onOk(() => {
          App.exitApp();
        });
      }
    } else {
      throw error;
    }
  }
}

async function mobileSetItem(key: string, value: string): Promise<void> {
  try {
    return SecureStorage.set(
      key,
      value,
      true,
      true,
      KeychainAccess.whenUnlocked // TODO: change this to 'afterFirstUnlock' for states that need to be accessed in the background
    )
  } catch (error) {
    if (error instanceof StorageError) {
      switch (StorageErrorType[error.code]) {
      case "userNotAuthenticated": {
        try {
          await nativeAuthenticate();
          return mobileSetItem(key, value);
        } catch (error) {
          console.error("Fatal error while trying to authenticate user on mobile", error)
          Dialog.create({
            title: i18n.global.t("capacitorStorage.fatalError.title"),
            message: i18n.global.t("capacitorStorage.fatalError.message"),
            ok: i18n.global.t("capacitorStorage.fatalError.ok"),
          }).onOk(() => {
            App.exitApp();
          });
        }
      }
      case "secureLockScreenDisabled":
        //TODO: redirectToCreateSecureLockScreen()
        console.error("Secure Lock Screen Error while trying to access secure storage", error)
        Dialog.create({
          title: i18n.global.t("capacitorStorage.secureLockScreenError.title"),
          message: i18n.global.t("capacitorStorage.secureLockScreenError.message"),
          ok: i18n.global.t("capacitorStorage.secureLockScreenError.ok"),
        }).onOk(() => {
          App.exitApp();
        });
        throw error;
      default:
        console.error("Fatal error while trying to access secure storage", error)
        Dialog.create({
          title: i18n.global.t("capacitorStorage.fatalError.title"),
          message: i18n.global.t("capacitorStorage.fatalError.message"),
          ok: i18n.global.t("capacitorStorage.fatalError.ok"),
        }).onOk(() => {
          App.exitApp();
        });
        throw error
      }
    } else {
      throw error;
    }
  }
}

function persistedStatePluginParamForPlatform<S extends StateTree = StateTree>(): PluginOptions<S> {
  if (Platform.is.nativeMobile) {
    return {
      storage: {
        getItem: async (key) => {
          return mobileGetItem(key);
        },
        setItem: async (key, value) => {
          return mobileSetItem(key, value);
        },
        removeItem: async (key) => {
          return mobileRemoveItem(key);
        },
      },
    };
  }
  //TODO: only do the following for anything else than desktop when Electron is supported:
  return {
    storage: {
      getItem: async (key) => {
        return localforage.getItem(key)
      },
      setItem: async (key, value) => {
        return localforage.setItem(key, value)
      },
      removeItem: async (key) => {
        return localforage.removeItem(key)
      },
    },
  };

}


export default store((/* { ssrContext } */) => {
  const pinia = createPinia();
  const installPersistedStatePlugin = createPersistedStatePlugin(persistedStatePluginParamForPlatform())
  pinia.use((context) => installPersistedStatePlugin(context))

  return pinia;
});
