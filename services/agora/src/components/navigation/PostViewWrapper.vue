<template>
  <div>
    <slot />

    <div class="bottomRightIcon">
      <q-btn-toggle v-model="toggleValue" class="my-custom-toggle" no-caps rounded toggle-color="primary"
        toggle-text-color="white" color="white" text-color="black" :options="[
          { label: 'Rank', value: 'rank' },
          { label: 'Post', value: 'post' }
        ]" />
    </div>

  </div>

</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const toggleValue = ref("rank");

const route = useRoute();
const router = useRouter();

if (route.name == "single-post") {
  toggleValue.value = "post";
}

const routeParams = {
  communityId: route.params.communityId,
  postSlugId: route.params.postSlugId
};

watch(toggleValue, () => {
  if (toggleValue.value == "post") {
    router.push({
      name: "single-post",
      params: routeParams
    })
  } else {
    router.push({
      name: "single-ranking",
      params: routeParams
    })
  }
});

</script>

<style scoped>
.bottomRightIcon {
  bottom: 2rem;
  position: fixed;
  right: calc(calc(100vw - calc(min(40rem, 100%))) / 2 + 1rem);
}
</style>