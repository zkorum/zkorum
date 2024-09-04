<template>
  <div>
    <div class="container">
      <swiper-container slidesPerView="4.5">
        <swiper-slide v-for="communityItem in communityList" v-bind:key="communityItem.code">
          <div class="hoverEffect">
            <RouterLink :to="{ name: 'community-single', params: { communityId: communityItem.id } }">
              <div class="iconPositioning">
                <div class="iconPadding">
                  <CommunityIcon />
                </div>
              </div>
            </RouterLink>
          </div>
        </swiper-slide>
      </swiper-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommunityStore } from "@/stores/community";
import CommunityIcon from "../community/CommunityIcon.vue";

const { communityList } = useCommunityStore();

</script>

<style scoped lang="scss">
a {
  text-decoration: none;
}

.container {
  border-radius: 15px;
}

.hoverEffect:hover {
  border-radius: 15px;
  background-color: rgb(0 0 0 / 0.08);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.iconPadding {
  padding: 1rem;
  width: 4rem;
}

.iconPositioning {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>