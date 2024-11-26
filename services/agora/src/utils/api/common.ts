import { type RawAxiosRequestConfig } from "axios";
import { useQuasar } from "quasar";
import { useAuthenticationStore } from "src/stores/authentication";
import { getPlatform } from "src/utils/common";
import { buildUcan, createDidIfDoesNotExist } from "../crypto/ucan/operation";

export function useCommonApi() {
  const $q = useQuasar();
  const { verificationPhoneNumber } = useAuthenticationStore();

  async function buildEncodedUcan(url: string, options: RawAxiosRequestConfig) {
    let platform: "mobile" | "web" = "web";

    platform = getPlatform($q.platform);

    console.log("Build UCAN for phoneNumber: " + verificationPhoneNumber.value);

    const { did, prefixedKey } = await createDidIfDoesNotExist(
      verificationPhoneNumber.value,
      platform
    );
    // TODO: get DID if exist, else create it
    // then create UCAN, then inject it below
    // if we create it, create a unique cryptographic random ID that is linked to the email address
    // return this so we can go to /onboarding/verify/email/{id}
    // store in Pinia and in secure storage:
    // - email => prefixedKey
    // - flowId => email
    // later after verification, will store UUID => prefixedKey

    const encodedUcan = await buildUcan({
      did,
      prefixedKey,
      pathname: url,
      method: options.method,
      platform,
    });
    return encodedUcan;
  }

  return { buildEncodedUcan };
}
