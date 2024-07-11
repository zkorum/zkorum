<template>
  <q-page class="full-width q-px-md" style="background-color: #e6e9ec">
    <q-infinite-scroll @load="onLoad" :offset="250" class="column flex-center">
      <div class="text-bold q-pa-md">{{ passphrase }}</div>
      <div class="text-bold q-pa-md">{{ verified }}</div>
      <!-- <example-component title="Example component" active :todos="todos" :meta="meta"></example-component> -->
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
import { getTrimmedPseudonym, getTimeFromNow, getPlatform } from "src/utils/common";
import { useQuasar } from "quasar";
import { KeychainAccess, SecureStorage } from "@zkorum/capacitor-secure-storage";
import { generateRandomPassphrase } from "@/shared/passphrase/generate";
import { SecureSigning } from "@zkorum/capacitor-secure-signing";
import * as ucans from "@ucans/ucans";
import { httpMethodToAbility, httpUrlToResourcePointer } from "shared/ucan/ucan";
import { publicKeyToDid } from "shared/did/util";
import * as requestAuth from "request/auth";

const $q = useQuasar();
const passphrase = ref("nothing");
let interval: NodeJS.Timeout | undefined = undefined

const verified = ref<boolean | string>("nothing")

function encodeToBase64(uint8Array: Uint8Array): string {
  return Buffer.from(uint8Array).toString("base64");
}

// Convert a Base64 string to a Uint8Array
function decodeFromBase64(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}

onMounted(async () => {
  await requestAuth.authenticate("test@email.com", false, getPlatform($q.platform));
  // if ($q.platform.is.mobile) {
  //   // try {
  //   // const prefixedKey = "com.zkorum.afterwork/v1_userid/sign"
  //   // const { publicKey } = await SecureSigning.generateKeyPair({ prefixedKey: prefixedKey })
  //   // const decodedPublicKey = decodeFromBase64(publicKey);
  //   // const accountDid = publicKeyToDid(decodedPublicKey)
  //   // const _u = await ucans.Builder.create()
  //   //   .issuedBy({
  //   //     did: () => accountDid,
  //   //     jwtAlg: "ES256",
  //   //     sign: async (msg: Uint8Array) => {
  //   //       const { signature } = await SecureSigning.sign({ prefixedKey: prefixedKey, data: encodeToBase64(msg) })
  //   //       return decodeFromBase64(signature);
  //   //     }
  //   //   })
  //   //   .toAudience("did:web:localhost%3A8080")
  //   //   .withLifetimeInSeconds(30)
  //   //   .claimCapability({
  //   //     // with: { scheme: "wnfs", hierPart: "//boris.fission.name/public/photos/" },
  //   //     // can: { namespace: "wnfs", segments: ["OVERWRITE"] },
  //   //     with: httpUrlToResourcePointer("http://localhost:8080/api/v1/testing"),
  //   //     can: httpMethodToAbility("POST"),
  //   //   })
  //   //   .build();
  //   // const encodedUcan = ucans.encode(u)
  //
  //   // api.defaults.headers?.Authorization = `Bearer ${encodedUcan}`;
  //   // verify ucan
  //   // await DefaultApiFactory(
  //   //   undefined,
  //   //   undefined,
  //   //   api
  //   // ).apiV1TestingPost({
  //   //   headers: {
  //   //     "Authorization": `Bearer ${encodedUcan}`
  //   //   }
  //   // });
  //   // } catch (e: unknown) {
  //   //   console.error("Error while verifying UCAN", (e as Error)?.message)
  //   //   verified.value = (e as Error)?.message;
  //   // }
  //
  //
  //   // interval = setInterval(async () => {
  //   //   try {
  //   //     const passphraseDataType = await SecureStorage.get("userid/passphrase", true, true);
  //   //     if (passphraseDataType === null) {
  //   //       passphrase.value = "";
  //   //     }
  //   //
  //   //     if (passphraseDataType instanceof Date) {
  //   //       passphrase.value = passphraseDataType.toISOString();
  //   //     } else {
  //   //       passphrase.value = JSON.stringify(passphraseDataType);
  //   //     }
  //   //     console.log(`Extracted passphrase: ${passphrase.value}`);
  //   //     const newPassphrase = generateRandomPassphrase()
  //   //     await SecureStorage.set(
  //   //       "userid/passphrase",
  //   //       newPassphrase,
  //   //       true,
  //   //       true,
  //   //       KeychainAccess.whenUnlocked
  //   //     )
  //   //   } catch (e) {
  //   //     console.error("An error occured", e)
  //   //   }
  //   // }, 1000)
  // }
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
