<template>
  <div>
    <ZKTitleBodyWrapper title="Settings">

      <ZKCard v-if="isAuthenticated" padding="1rem">
        <div v-for="item in settingsItemList" :key="item.icon" class="menuItem" @click="item.action">
          <div>
            <q-icon :name="item.icon" size="1.5rem" />
          </div>
          <div>
            {{ item.label }}
          </div>
        </div>
      </ZKCard>
    </ZKTitleBodyWrapper>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import ZKCard from "src/components/ui-library/ZKCard.vue";
import ZKTitleBodyWrapper from "src/components/ui-library/ZKTitleBodyWrapper.vue";
import { useAuthenticationStore } from "src/stores/authentication";

const { isAuthenticated } = storeToRefs(useAuthenticationStore());

interface SettingsInterface {
  icon: string;
  label: string;
  action: () => void;
}

const settingsItemList: SettingsInterface[] = [
  {
    icon: "mdi-ab-testing",
    label: "Test",
    action: () => { }
  }
];

</script>

<style scoped lang="scss">
.menuItem {
  display:flex;
  gap: 2rem;
  align-items: center;
  font-size: 1rem;
  cursor: pointer;
}

</style>
