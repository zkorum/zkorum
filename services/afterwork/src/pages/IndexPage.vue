<template>
  <q-page class="full-width q-px-md" style="background-color: #e6e9ec">
    <q-infinite-scroll @load="onLoad" :offset="250" class="column flex-center">
      <!-- <example-component title="Example component" active :todos="todos" :meta="meta"></example-component> -->
      <div v-for="(item, index) in  items " :key="index" style="max-width: 600px" class="full-width">
        <q-card @click="$router.push('/post')" :class="index === 0 ? 'q-my-sm q-pa-sm' : 'q-mb-sm q-pa-sm'">
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
import { Ref, ref } from "vue";
// import { Todo, Meta } from 'components/models';
// import ExampleComponent from 'components/ExampleComponent.vue';
import PollResultView from "components/poll/PollResultView.vue";
import { DefaultApiFactory } from "src/api/api";
import { api } from "src/boot/axios";
import { ExtendedPostData } from "src/shared/types/zod";
import { getTrimmedPseudonym, getTimeFromNow } from "src/utils/common";

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
