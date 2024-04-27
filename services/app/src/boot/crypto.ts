import { boot } from "quasar/wrappers"
import { Buffer } from "buffer";

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  // avoid "Buffer is not defined" error
  globalThis.Buffer = Buffer;

})
