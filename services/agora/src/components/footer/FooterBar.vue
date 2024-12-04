<template>
  <div class="flexIcons">
    <RouterLink :to="{ name: 'default-home-feed' }">
      <div class="iconStyle">
        <q-icon name="mdi-home" size="1.6rem" :color="route.name === 'default-home-feed'
          ? 'color-highlight'
          : 'color-text-weak'
          " />
        <div :class="'text-' +
          (route.name === 'default-home-feed'
            ? 'color-highlight'
            : 'color-text-weak')
          ">
          Home
        </div>
      </div>
    </RouterLink>

    <RouterLink :to="{ name: 'followed-topics' }">
      <div class="iconStyle">
        <q-icon name="mdi-book-open-blank-variant-outline" size="1.6rem" :color="route.name === 'followed-topics'
          ? 'color-highlight'
          : 'color-text-weak'
          " />
        <div :class="'text-' +
          (route.name === 'followed-topics'
            ? 'color-highlight'
            : 'color-text-weak')
          ">
          Topics
        </div>
      </div>
    </RouterLink>

    <div class="iconStyle" @click="accessProfile()">
      <q-icon name="mdi-account-circle" size="1.6rem" :color="route.name === 'user-profile-posts' || route.name === 'user-profile-comments' ? 'color-highlight' : 'color-text-weak'
        " />
      <div :class="'text-' +
        (route.name === 'user-profile-posts' || route.name === 'user-profile-comments'
          ? 'color-highlight'
          : 'color-text-weak')
        ">
        Profile
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthenticationStore } from "src/stores/authentication";
import { useDialog } from "src/utils/ui/dialog";
import { useRoute, useRouter } from "vue-router";

const { isAuthenticated } = useAuthenticationStore();

const dialog = useDialog();

const route = useRoute();
const router = useRouter();

function accessProfile() {
  if (!isAuthenticated.value) {
    dialog.showLoginConfirmationDialog();
  } else {
    router.push({ name: "user-profile-posts" });
  }
}
</script>

<style scoped lang="scss">
.flexIcons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.iconStyle {
  padding: 0.3rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.7rem;
  font-weight: bold;
}
</style>
