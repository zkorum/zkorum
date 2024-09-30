import { onMounted } from "vue";
import { getPlatform } from "../common";
import { authenticate } from "../request/auth";
import { useQuasar } from "quasar";

export function useSigning() {

  const $q = useQuasar();

  /*
  const verified = ref<boolean | string>("nothing");
  const passphrase = ref("nothing");
  */

  /*
  const interval: NodeJS.Timeout | undefined = undefined;
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
  */

  onMounted(async () => {
    const email = "test@gmail.com"; // b2@essec.edu
    await authenticate(email, true, getPlatform($q.platform));
    /*
    if ($q.platform.is.mobile) {
      try {
        const prefixedKey = "com.zkorum.agora/v1_userid/sign";
        const { publicKey } = await SecureSigning.generateKeyPair({ prefixedKey: prefixedKey });
        const decodedPublicKey = decodeFromBase64(publicKey);
        const accountDid = publicKeyToDid(decodedPublicKey);
        const u = await ucans.Builder.create()
          .issuedBy({
            did: () => accountDid,
            jwtAlg: "ES256",
            sign: async (msg: Uint8Array) => {
              const { signature } = await SecureSigning.sign({ prefixedKey: prefixedKey, data: encodeToBase64(msg) });
            return decodeFromBase64(signature);
          }
        })
        .toAudience("did:web:localhost%3A8080")
        .withLifetimeInSeconds(30)
        .claimCapability({
          // with: { scheme: "wnfs", hierPart: "boris.fission.name/public/photos/" },
          // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
          with: httpUrlToResourcePointer("http:localhost:8080/api/v1/testing"),
          can: httpMethodToAbility("POST"),
        })
        .build();
      const encodedUcan = ucans.encode(u);

      api.defaults.headers.Authorization = `Bearer ${encodedUcan}`;
      // verify ucan
      await DefaultApiFactory(
        undefined,
        undefined,
        api
      ).apiV1AuthAuthenticatePost({
        email: email,
        isRequestingNewCode: false
      });
      } catch (e: unknown) {
        console.error("Error while verifying UCAN", (e as Error)?.message);
        verified.value = (e as Error)?.message;
      }

      interval = setInterval(async () => {
        try {
          const passphraseDataType = await SecureStorage.get("userid/passphrase", true, true);
          if (passphraseDataType === null) {
            passphrase.value = "";
          }

          if (passphraseDataType instanceof Date) {
            passphrase.value = passphraseDataType.toISOString();
          } else {
            passphrase.value = JSON.stringify(passphraseDataType);
          }
          console.log(`Extracted passphrase: ${passphrase.value}`);
          const newPassphrase = generateRandomPassphrase();
          await SecureStorage.set(
            "userid/passphrase",
            newPassphrase,
            true,
            true,
            KeychainAccess.whenUnlocked
          );
        } catch (e) {
          console.error("An error occured", e);
        }
      }, 1000);

   }
   */

    /*
  // Convert a Base64 string to a Uint8Array
  function decodeFromBase64(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  function encodeToBase64(uint8Array: Uint8Array): string {
    return Buffer.from(uint8Array).toString("base64");
  }
  */
});
}
