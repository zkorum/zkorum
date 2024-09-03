<template>
  <div>
    <div class="topTag">
      <div :class="{ iconSizeLarge: !isCompatSize, iconSizeSmall: isCompatSize }">
        <CommunityIcon :community-id="communityId" :showCountryName="false" />
      </div>

      <div>
        {{ getTimeFromNow(createdAt) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTimeFromNow } from "@/utils/common";
import CommunityIcon from "../community/CommunityIcon.vue";

defineProps<{
  communityId: string;
  createdAt: Date;
  isCompatSize: boolean;
}>()

</script>

<style scoped>
.topTag {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.iconSizeLarge {
  width: 4rem;
}

.iconSizeSmall {
  width: 2.5rem;
}
</style>