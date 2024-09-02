<template>
  <div>
    <div class="container">
      <div v-for="commentItem in filteredCommentList" v-bind:key="commentItem.index">
        <ZKCard>
          <div class="contentLayout">
            <div>
              Vote on other people's statements
            </div>

            <div class="userComment">
              {{ commentItem.comment }}
            </div>

            <div class="rankingButtonCluster">
              <ZKButton flat text-color-flex="black" icon="mdi-thumb-up" />
              <ZKButton flat text-color-flex="black" label="Pass" />
              <ZKButton flat text-color-flex="black" icon="mdi-thumb-down" />
            </div>
          </div>
        </ZKCard>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { DummyCommentFormat } from "@/stores/post";
import ZKCard from "../ui-library/ZKCard.vue";
import ZKButton from "../ui-library/ZKButton.vue";

const props = defineProps<{
  commentList: DummyCommentFormat[],
  unrankedCommentIndexList: number[]
}>()

const filteredCommentList: DummyCommentFormat[] = [];

for (let i = 0; i < props.commentList.length; i++) {
  const commentItem = props.commentList[i];
  if (props.unrankedCommentIndexList.includes(commentItem.index)) {
    filteredCommentList.push(commentItem);
  }
}

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rankingButtonCluster {
  display: flex;
  justify-content: space-around;
}

.contentLayout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.userComment {
  text-align: center;
  font-size: 1.2rem;
}
</style>