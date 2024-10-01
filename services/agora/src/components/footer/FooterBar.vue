<template>
  <div class="flexIcons">
    <RouterLink :to="{ name: 'default-home-feed' }">
      <div class="iconStyle">
        <q-icon name="mdi-home" size="1.6rem"
          :color="route.name === 'default-home-feed' ? 'color-highlight' : 'color-text-weak'" />
        <div :class="'text-' + (route.name === 'default-home-feed' ? 'color-highlight' : 'color-text-weak')">
          Home
        </div>
      </div>

    </RouterLink>

    <div class="iconStyle" @click="accessProfile()">
      <q-icon name="mdi-account-circle" size="1.6rem"
        :color="route.name === 'user-profile' ? 'color-highlight' : 'color-text-weak'" />
      <div :class="'text-' + (route.name === 'user-profile' ? 'color-highlight' : 'color-text-weak')">
        Profile
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useAuthenticationStore } from "src/stores/authentication";
import { useDialog } from "src/utils/ui/dialog";
import { useRoute } from "vue-router";

const authenticationStore = useAuthenticationStore();
const dialog = useDialog();

const route = useRoute();

function accessProfile() {
  if (!authenticationStore.isAuthenticated) {
    dialog.showLoginConfirmationDialog();
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


