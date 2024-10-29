import { boot } from "quasar/wrappers";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot((/* { app, router, ... } */) => {
  CapacitorUpdater.notifyAppReady();
});
