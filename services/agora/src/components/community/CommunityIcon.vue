<template>
  <img class="flagImage" :src="imageLink" />
</template>

<script setup lang="ts">
import { useCommunityStore } from "@/stores/community";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  communityId: string
}>()

const imageLink = ref("");

const communityList = useCommunityStore().communityList;

onMounted(() => {
  mapCommunityItem();
})

watch(() => props.communityId, () => {
  mapCommunityItem();
})

function mapCommunityItem() {
  for (let i = 0; i < communityList.length; i++) {
    const communityItem = communityList[i];
    if (communityItem.id == props.communityId) {
      imageLink.value = "/images/communities/flags/" + communityItem.code + ".svg";
      break;
    }
  }
}

</script>

<style scoped>
.flagImage {
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: #e5e7eb;
  max-width: 100%;
}
</style>