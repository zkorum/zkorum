import { publicKeyToDid } from "src/shared/did/util";
import { SupportedPlatform } from "src/utils/common";
import { SecureSigning } from "@zkorum/capacitor-secure-signing";
import { base64Decode } from "src/shared/common/base64";
import { getWebCryptoStore } from "../store";
import * as DID from "./did/index";
import { useSessionStore } from "src/stores/session";
import * as ucans from "@ucans/ucans";
import { httpMethodToAbility, httpPathnameToResourcePointer } from "src/shared/ucan/ucan";
import { base64 } from "src/shared/common"

function getPrefixedKeyByEmail(email: string) {
  return `com.zkorum.agora/v1/${email}/sign`
}

interface CreateDidReturn {
  did: string;
  flowId: string;
  prefixedKey: string;
}

//
//TODO: move the web target's code to the Capacitor plugin
export async function createDidIfDoesNotExist(email: string, platform: SupportedPlatform): Promise<CreateDidReturn> {
  const sessionStore = useSessionStore()
  const prefixedKey = getPrefixedKeyByEmail(email);
  switch (platform) {
  case "mobile":
    const { publicKey } = await SecureSigning.createKeyPairIfDoesNotExist({ prefixedKey: prefixedKey });
    const decodedPublicKey = base64Decode(publicKey);
    const didMobile = publicKeyToDid(decodedPublicKey);
    sessionStore.setPrefixedKey(email, prefixedKey);
    const flowIdMobile = sessionStore.getOrSetFlowId(email);
    return { did: didMobile, flowId: flowIdMobile, prefixedKey }; // TODO: also return flowId!
  case "web":
    const cryptoStore = await getWebCryptoStore();
    await cryptoStore.keystore.createIfDoesNotExists(prefixedKey);
    const didWeb = await DID.write(cryptoStore, email);
    sessionStore.setPrefixedKey(email, prefixedKey);
    const flowIdWeb = sessionStore.getOrSetFlowId(email);
    return { did: didWeb, flowId: flowIdWeb, prefixedKey };
  }
}

interface CreateUcanProps {
  did: string;
  prefixedKey: string;
  pathname: string;
  method: string | undefined;
  platform: SupportedPlatform

}

async function buildWebUcan({ did, prefixedKey, pathname, method }: CreateUcanProps): Promise<string> {
  const webCryptoStore = await getWebCryptoStore();
  const u = await ucans.Builder.create()
    .issuedBy({
      did: () => did,
      jwtAlg: await webCryptoStore.keystore.getUcanAlgorithm(),
      sign: async (msg: Uint8Array) => webCryptoStore.keystore.sign(msg, prefixedKey)
    })
    .toAudience(process.env.VITE_BACK_DID)
    .withLifetimeInSeconds(30)
    .claimCapability({
      // with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
      // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
      with: httpPathnameToResourcePointer(pathname),
      can: httpMethodToAbility(method !== undefined ? method : "POST"),
    })
    .build();
  const encodedUcan = ucans.encode(u);
  return encodedUcan;
}

async function buildMobileUcan({ did, prefixedKey, pathname, method }: CreateUcanProps): Promise<string> {
  const u = await ucans.Builder.create()
    .issuedBy({
      did: () => did,
      jwtAlg: "ES256",
      sign: async (msg: Uint8Array) => {
        const { signature } = await SecureSigning.sign({ prefixedKey: prefixedKey, data: base64.base64Encode(msg) })
        return base64.base64Decode(signature);
      }
    })
    .toAudience(process.env.VITE_BACK_DID)
    .withLifetimeInSeconds(30)
    .claimCapability({
      // with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
      // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
      with: httpPathnameToResourcePointer(pathname),
      can: httpMethodToAbility(method !== undefined ? method : "POST"),
    })
    .build();
  const encodedUcan = ucans.encode(u);
  return encodedUcan;
}

export async function buildUcan(props: CreateUcanProps): Promise<string> {
  switch (props.platform) {
  case "web":
    return buildWebUcan(props)
  case "mobile":
    return buildMobileUcan(props)
  }
}

export function buildAuthorizationHeader(encodedUcan: string) {
  return {
    Authorization: `Bearer ${encodedUcan}`
  }
}
