<template>
  <div>
    <div class="container">

      <div class="contentLayout" v-if="unrankedComment != null">
        <div class="postTitle">
          {{ postItem.payload.title }}
        </div>

        <div class="postBody">
          {{ postItem.payload.body }}
        </div>

        <ZKCard>
          <div class="rankingDiv">
            <div class="userComment">
              {{ unrankedComment?.comment }}
            </div>

            <div class="rankingButtonCluster">
              <ZKButton flat text-color-flex="black" icon="mdi-thumb-down" />
              <ZKButton flat text-color-flex="black" label="Pass" />
              <ZKButton flat text-color-flex="black" icon="mdi-thumb-up" />
            </div>
          </div>

        </ZKCard>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { usePostStore } from "@/stores/post";
import ZKButton from "../ui-library/ZKButton.vue";
import ZKCard from "../ui-library/ZKCard.vue";

const props = defineProps<{
  postSlugId: string
}>()

const { getUnrankedComment, getPostBySlugId } = usePostStore();

const postItem = getPostBySlugId(props.postSlugId);
const unrankedComment = getUnrankedComment(props.postSlugId)

</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(100%, 30rem);
  margin: auto;
}

.rankingButtonCluster {
  display: flex;
  justify-content: space-around;
}

.contentLayout {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.userComment {
  text-align: center;
  font-size: 1.2rem;
}

.postTitle {
  text-align: center;
  font-size: 1.5rem;
}

.postBody {
  font-size: 1rem;
  text-align: center;
}

.rankingDiv {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}
</style>