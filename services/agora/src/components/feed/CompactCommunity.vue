<template>
  <div>
    <div class="container">
      <swiper-container slidesPerView="4.5">
        <swiper-slide v-for="communityName in communityList" v-bind:key="communityName">
          <RouterLink :to="{ name: 'community-single', params: { countryCode: communityName } }">
            <div class="outerPadding hoverEffect">
              <CommunityIcon :communityName="communityName" :showCountryName="false" />
            </div>
          </RouterLink>
        </swiper-slide>
      </swiper-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import CommunityIcon from "../community/CommunityIcon.vue";

const communityList = ["world", "france", "china", "united-states", "russia", "japan"];

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

.outerPadding {
  padding: 1rem;
}
</style>