<template>
  <q-page>
    <q-infinite-scroll @load="onLoad" :offset="250" class="column flex-center">
      <div class="postListFlex">
        <CompactPost :extended-post-data="item" v-for="(item, index) in compactPostDataList" :key="index" />
      </div>
    </q-infinite-scroll>
  </q-page>
</template>

<script setup lang="ts">
import { Ref, onBeforeUnmount, onMounted, ref } from "vue";
// import { Todo, Meta } from 'components/models';
// import ExampleComponent from 'components/ExampleComponent.vue';
import CompactPost from "@/components/feed/CompactPost.vue";
import { DefaultApiFactory } from "src/api/api";
import { api } from "src/boot/axios";
import { ExtendedPostData } from "src/shared/types/zod";

// const passphrase = ref("nothing");
// const verified = ref<boolean | string>("nothing")

let interval: NodeJS.Timeout | undefined = undefined

/*
function encodeToBase64(uint8Array: Uint8Array): string {
  return Buffer.from(uint8Array).toString("base64");
}

// Convert a Base64 string to a Uint8Array
function decodeFromBase64(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
}
*/

onMounted(async () => {
  // await requestAuth.authenticate("test@email.com", false, getPlatform($q.platform));
  // if ($q.platform.is.mobile) {
  //   // try {
  //   // const prefixedKey = "com.zkorum.agora/v1_userid/sign"
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

const postData: ExtendedPostData = {
  metadata: {
    uid: "TEST UID",
    slugId: "TEST SLUG ID",
    isHidden: false,
    updatedAt: new Date(),
    lastReactedAt: new Date(),
    commentCount: 10
  },
  payload: {
    title: "TEST TITLE",
    body: "Answer misery adieus add wooded how nay men before though. Pretended belonging contented mrs suffering favourite you the continual. Mrs civil nay least means tried drift. Natural end law whether but and towards certain. Furnished unfeeling his sometimes see day promotion. Quitting informed concerns can men now. Projection to or up conviction uncommonly delightful continuing. In appetite ecstatic opinions hastened by handsome admitted. "
  },
  author: {
    pseudonym: "TEST pseudonym",
    domain: "google.com"
  }
};
const compactPostDataList: Ref<ExtendedPostData[]> = ref([postData, postData, postData]);

defineOptions({
  name: "IndexPage",
});

async function onLoad() {
  if (false) {
    compactPostDataList.value = await fetchFeedMore({
      showHidden: false,
      lastReactedAt: undefined,
    });
  }
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

<style scoped>
.postListFlex {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: min(40rem, 100%);
  padding-top: 2rem;
}
</style>
