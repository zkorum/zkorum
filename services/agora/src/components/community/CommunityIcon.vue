<template>
  <div>
    <div class="communityItemStyle">
      <div class="flagStyle">
        <img class="flagImage" :src="imageLink" :style="{ width: compact ? '2rem' : '3rem' }" />
      </div>
      <div class="flagCountryName" v-if="showCountryName">
        {{ countryName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommunityStore } from "@/stores/community";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  communityId: string
  showCountryName: boolean
  compact: boolean
}>()

const imageLink = ref("");
const countryName = ref("");

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
      countryName.value = communityItem.countryName;
      break;
    }
  }
}

</script>

<style scoped>
.communityItemStyle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.flagStyle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flagImage {
  border-radius: 5px;
  border-style: solid;
  border-width: 1px;
  border-color: #e5e7eb;
}

.flagCountryName {
  text-align: center;
  color: black;
}
</style>