<template>
  <q-page class="full-width q-px-md" style="background-color: #e6e9ec">
    <q-infinite-scroll @load="onLoad" :offset="250" class="column flex-center">
      <!-- <example-component title="Example component" active :todos="todos" :meta="meta"></example-component> -->
      <div class="text-bold" style="margin-bottom: -5px;">{{ passphrase }}</div>
      <div class="text-bold" style="margin-bottom: -5px;">{{ verified }}</div>
      <div v-for="(item, index) in  items " :key="index" style="max-width: 600px" class="full-width">
        <q-card @click="$router.push('/post')" class="q-mb-sm q-pa-sm">
          <div class="column full-width" style="gap: 15px;">
            <div class="row items-center justify-start" style="gap: 5px; background-color: white">
              <q-avatar size="42px" color="essec-blue" text-color="white">E</q-avatar>
              <div class="column">
                <!-- <div class="row flex-center" style="gap: 3px;"> -->
                <div class="text-bold" style="margin-bottom: -5px;">essec.edu <q-icon name="verified" />
                </div>
                <div class="text-caption" style="color: rgba(0, 0, 0, 0.6); margin-bottom: -5px;">
                  {{ getTrimmedPseudonym(item.author.pseudonym) }}
                </div>
                <div class="text-caption" style="color: rgba(0, 0, 0, 0.6);">{{
      getTimeFromNow(item.metadata.lastReactedAt) }}</div>
              </div>
            </div>
            <div class="column q-pa-md" style="gap: 10px; border-radius: 8px; border: 1px solid #e6e9ec;">
              <div style="font-weight: bold; font-size: 1.125rem; line-height: 1.5rem;">
                {{ item.payload.title }}
              </div>
              <div class="text-body2" style="color: rgba(0, 0, 0, 0.6);" v-if="item.payload?.body !== undefined">
                {{
      item.payload.body.length <= 200 ? item.payload.body : `${item.payload.body.slice(0, 200)} ...` }} </div>
                  <div class="q-my-sm" v-if="item.payload.poll !== undefined">
                    <poll-result-view :result="item.payload.poll.result" :options="item.payload.poll.options"
                      :pollResponse="undefined" /> <!-- TODO: pollResponse -->
                  </div>
              </div>
              <div>
                <q-btn dense align="left" icon="o_insert_comment" class="text-body2" style="color: rgba(0, 0, 0, 0.6);"
                  unelevated no-caps color="white" text-color="rgba(0, 0, 0, 0.6)"
                  :label="item.metadata.commentCount === 0 ? 'Comment' : item.metadata.commentCount === 1 ? '1 Comment' : `${item.metadata.commentCount} Comments`" />
              </div>
            </div>
        </q-card>
        <!-- <p>{{ item.author }}</p> -->
        <!-- <p>{{ item.payload.title }}</p> -->
        <!-- <p>{{ item.metadata.uid }}</p> -->
        <!-- <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum repellendus sit voluptate voluptas eveniet -->
        <!--   porro. Rerum blanditiis perferendis totam, ea at omnis vel numquam exercitationem aut, natus minima, porro -->
        <!--   labore.</p> -->
      </div>
    </q-infinite-scroll>
  </q-page>
</template>

<script setup lang="ts">
import { Ref, onBeforeUnmount, onMounted, ref } from "vue";
// import { Todo, Meta } from 'components/models';
// import ExampleComponent from 'components/ExampleComponent.vue';
import PollResultView from "components/poll/PollResultView.vue";
import { DefaultApiFactory } from "src/api/api";
import { api } from "src/boot/axios";
import { ExtendedPostData } from "src/shared/types/zod";
import { getTrimmedPseudonym, getTimeFromNow } from "src/utils/common";
import { useQuasar } from "quasar";
import { KeychainAccess, SecureStorage } from "@zkorum/capacitor-secure-storage";
import { generateRandomPassphrase } from "@/shared/passphrase/generate";
import { SecureSigning } from "@zkorum/capacitor-secure-signing";
import { base64 } from "@/shared/common";
import * as ucan from "@ucans/ucans";
import * as uint8arrays from "uint8arrays";
// import bigInt from "big-integer"
import { httpMethodToAbility, httpUrlToResourcePointer } from "@/shared/ucan/ucan";

const $q = useQuasar();
const passphrase = ref("");
let interval: NodeJS.Timeout | undefined = undefined

// ECC crypto - DID
// https://github.com/ucan-wg/ts-ucan/blob/bf35b419fe3c6360e2fde32c00b8de06bca6d6b4/packages/default-plugins/src/p256/crypto.ts#L103-L114

/** https://github.com/multiformats/multicodec/blob/e9ecf587558964715054a0afcc01f7ace220952c/table.csv#L141 */
const P256_DID_PREFIX = new Uint8Array([0x80, 0x24])

const BASE58_DID_PREFIX = "did:key:z" // z is the multibase prefix for base58btc byte encoding


// const didToPublicKey = (did: string): Uint8Array => {
//   // The multiformats space (used by did:key) specifies that NIST P-256
//   // keys should be encoded as the 33-byte compressed public key,
//   // instead of the 65-byte raw public key
//   const keyBytes = keyBytesFromDid(did, P256_DID_PREFIX)
//   return decompressP256Pubkey(keyBytes)
// }

const publicKeyToDid = (publicKey: Uint8Array): string => {
  const compressed = compressP256Pubkey(publicKey)
  return didFromKeyBytes(compressed, P256_DID_PREFIX)
}

/**
 * Determines if a Uint8Array has a given indeterminate length-prefix.
 */
// const hasPrefix = (
//   prefixedKey: Uint8Array,
//   prefix: Uint8Array
// ): boolean => {
//   return uint8arrays.equals(prefix, prefixedKey.subarray(0, prefix.byteLength))
// }

// function keyBytesFromDid(did: string, expectedPrefix: Uint8Array): Uint8Array {
//   if (!did.startsWith(BASE58_DID_PREFIX)) {
//     throw new Error("Please use a base58-encoded DID formatted `did:key:z...`")
//   }
//   const didWithoutPrefix = did.slice(BASE58_DID_PREFIX.length)
//   const bytes = uint8arrays.fromString(didWithoutPrefix, "base58btc")
//   if (!hasPrefix(bytes, expectedPrefix)) {
//     throw new Error(`Expected prefix: ${expectedPrefix}`)
//   }
//   return bytes.slice(expectedPrefix.length)
// }

function didFromKeyBytes(publicKeyBytes: Uint8Array, prefix: Uint8Array): string {
  const bytes = uint8arrays.concat([prefix, publicKeyBytes])
  const base58Key = uint8arrays.toString(bytes, "base58btc")
  return BASE58_DID_PREFIX + base58Key
}

// https://github.com/ucan-wg/ts-ucan/blob/bf35b419fe3c6360e2fde32c00b8de06bca6d6b4/packages/default-plugins/src/p256/crypto.ts#L118-L195

// PUBLIC KEY COMPRESSION
// -------------------------

// Compression & Decompression algos from:
// https://stackoverflow.com/questions/48521840/biginteger-to-a-uint8array-of-bytes

// Public key compression for NIST P-256
const compressP256Pubkey = (pubkeyBytes: Uint8Array): Uint8Array => {
  if (pubkeyBytes.length !== 65) {
    throw new Error("Expected 65 byte pubkey")
  } else if (pubkeyBytes[0] !== 0x04) {
    throw new Error("Expected first byte to be 0x04")
  }
  // first byte is a prefix
  const x = pubkeyBytes.slice(1, 33)
  const y = pubkeyBytes.slice(33, 65)
  const out = new Uint8Array(x.length + 1)

  out[0] = 2 + (y[y.length - 1] & 1)
  out.set(x, 1)

  return out
}

// Public key decompression for NIST P-256
// const decompressP256Pubkey = (compressed: Uint8Array): Uint8Array => {
//   if (compressed.length !== 33) {
//     throw new Error("Expected 33 byte compress pubkey")
//   } else if (compressed[0] !== 0x02 && compressed[0] !== 0x03) {
//     throw new Error("Expected first byte to be 0x02 or 0x03")
//   }
//   // Consts for P256 curve
//   const two = bigInt(2)
//   // 115792089210356248762697446949407573530086143415290314195533631308867097853951
//   const prime = two
//     .pow(256)
//     .subtract(two.pow(224))
//     .add(two.pow(192))
//     .add(two.pow(96))
//     .subtract(1)
//   const b = bigInt(
//     "41058363725152142129326129780047268409114441015993725554835256314039467401291",
//   )
//
//   // Pre-computed value, or literal
//   const pIdent = prime.add(1).divide(4) // 28948022302589062190674361737351893382521535853822578548883407827216774463488
//
//   // This value must be 2 or 3. 4 indicates an uncompressed key, and anything else is invalid.
//   const signY = bigInt(compressed[0] - 2)
//   const x = compressed.slice(1)
//   const xBig = bigInt(uint8arrays.toString(x, "base10"))
//
//   // y^2 = x^3 - 3x + b
//   const maybeY = xBig
//     .pow(3)
//     .subtract(xBig.multiply(3))
//     .add(b)
//     .modPow(pIdent, prime)
//
//   let yBig
//   // If the parity matches, we found our root, otherwise it's the other root
//   if (maybeY.mod(2).equals(signY)) {
//     yBig = maybeY
//   } else {
//     // y = prime - y
//     yBig = prime.subtract(maybeY)
//   }
//   const y = uint8arrays.fromString(yBig.toString(10), "base10")
//
//   // left-pad for smaller than 32 byte y
//   const offset = 32 - y.length
//   const yPadded = new Uint8Array(32)
//   yPadded.set(y, offset)
//
//   // concat coords & prepend P-256 prefix
//   const publicKey = uint8arrays.concat([[0x04], x, yPadded])
//   return publicKey
// }

const verified = ref<boolean | undefined | string>(undefined)

onMounted(async () => {
  if ($q.platform.is.mobile) {
    const prefixedKey = "com.zkorum.afterwork/v1_userid/sign"
    const { publicKey } = await SecureSigning.generateKeyPair({ prefixedKey: prefixedKey })
    const decodedPublicKey = base64.base64Decode(publicKey);
    const accountDid = publicKeyToDid(decodedPublicKey)
    const u = await ucan.Builder.create()
      .issuedBy({
        did: () => accountDid,
        jwtAlg: "ES256",
        sign: async (msg: Uint8Array) => {
          const { signature } = await SecureSigning.sign({ prefixedKey: prefixedKey, data: base64.base64Encode(msg) })
          return base64.base64Decode(signature);
        }
      })
      .toAudience("did:web:zkorum.com")
      .withLifetimeInSeconds(30)
      .claimCapability({
        // with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
        // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
        with: httpUrlToResourcePointer("https://zkorum.com/v1/some/endpoint"),
        can: httpMethodToAbility("GET"),
      })
      .build();
    const encodedUcan = ucan.encode(u)

    // verify ucan
    const rootIssuerDid = ucan.parse(encodedUcan).payload.iss;
    const result = await ucan.verify(encodedUcan, {
      audience: "did:web:zkorum.com",
      isRevoked: async (_ucan) => false, // users' generated UCANs are short-lived action-specific one-time token so the revocation feature is unnecessary
      requiredCapabilities: [
        {
          capability: {
            with: httpUrlToResourcePointer("https://zkorum.com/v1/some/endpoint"),
            can: httpMethodToAbility("GET"),
          },
          rootIssuer: rootIssuerDid,
        },
      ],
    });
    if (result.ok) {
      verified.value = true
    } else {
      console.error(result.error)
      verified.value = new AggregateError(result.error).message
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
        const newPassphrase = generateRandomPassphrase()
        await SecureStorage.set(
          "userid/passphrase",
          newPassphrase,
          true,
          true,
          KeychainAccess.whenUnlocked
        )
      } catch (e) {
        console.error("An error occured", e)
      }
    }, 1000)
  }
});

onBeforeUnmount(() => {
  clearInterval(interval);
})

interface FetchFeedProps {
  showHidden: boolean;
  lastReactedAt: Date | undefined;
}

async function fetchFeedMore({
  showHidden,
  lastReactedAt,
}: FetchFeedProps): Promise<ExtendedPostData[]> {
  const response = await DefaultApiFactory(
    undefined,
    undefined,
    api
  ).apiV1FeedFetchMorePost({
    showHidden: showHidden,
    lastReactedAt: lastReactedAt?.toISOString(),
  });
  if (response.data !== undefined) {
    return response.data.map((value) => {
      return {
        metadata: {
          uid: value.metadata.uid,
          slugId: value.metadata.slugId,
          isHidden: value.metadata.isHidden,
          updatedAt: new Date(value.metadata.updatedAt),
          lastReactedAt: new Date(value.metadata.lastReactedAt),
          commentCount: value.metadata.commentCount,
        },
        payload: value.payload,
        author: value.author,
      };
    });
  } else {
    console.warn("No data fetched");
    return [];
  }
}

const items: Ref<ExtendedPostData[]> = ref([]);

defineOptions({
  name: "IndexPage",
});

async function onLoad() {
  items.value = await fetchFeedMore({
    showHidden: false,
    lastReactedAt: undefined,
  });

}

// const todos = ref<Todo[]>([
//   {
//     id: 1,
//     content: 'ct1'
//   },
//   {
//     id: 2,
//     content: 'ct2'
//   },
//   {
//     id: 3,
//     content: 'ct3'
//   },
//   {
//     id: 4,
//     content: 'ct4'
//   },
//   {
//     id: 5,
//     content: 'ct5'
//   }
// ]);

// const meta = ref<Meta>({
//   totalCount: 1200
// });
</script>
