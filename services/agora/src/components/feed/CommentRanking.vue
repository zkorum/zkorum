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
          <div>
            Vote on other people's statements (1/3)
          </div>

          <div class="rankingDiv">
            <div class="userComment">
              {{ unrankedComment?.comment }}
            </div>

            <div class="rankingButtonCluster">
              <ZKButton flat text-color-flex="black" icon="mdi-thumb-down" size="1.3rem" />
              <ZKButton outline text-color-flex="black" label="Pass" size="1rem" />
              <ZKButton flat text-color-flex="black" icon="mdi-thumb-up" size="1.3rem" />
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
  font-size: 1rem;
}

.rankingButtonCluster {
  display: flex;
  justify-content: space-between
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

.postTitle {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.postBody {
  font-size: 1rem;
  text-align: center;
}

.rankingDiv {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding-top: 2rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 2rem;
}
</style>