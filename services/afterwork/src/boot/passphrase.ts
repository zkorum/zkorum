import { boot } from "quasar/wrappers"
import {
  KeychainAccess,
  SecureStorage,
} from "@aparajita/capacitor-secure-storage"
import { generateRandomPassphrase } from "@/shared/passphrase/generate"


// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async (/* { app, router, ... } */) => {
  const newPassphrase = generateRandomPassphrase()
  console.log(newPassphrase)
  await SecureStorage.setKeyPrefix("com.zkorum.afterwork/v1")
  await SecureStorage.set(
    "userid/passphrase",
    newPassphrase,
    true,
    true,
    KeychainAccess.whenUnlocked
  )
})
