<template>
  <div>
    <div class="container">
      <div class="titleStyle">
        {{ title }}
      </div>

      <ZKCard padding="0rem">
        <div class="flexStyle">
          <div v-for="(item, index) in settingsItemList" :key="item.icon">
            <ZKHoverEffect :enable-hover="true">
              <RouterLink :to="{ name: item.routeName }">
                <div class="menuItem" :class="{ isWarningStyle: item.isWarning }" @click="item.action">
                  <div>
                    <q-icon :name="item.icon" size="1.5rem" />
                  </div>
                  <div>
                    {{ item.label }}
                  </div>
                </div>

                <q-separator v-if="index != settingsItemList.length - 1" />
              </RouterLink>
            </ZKHoverEffect>

          </div>
        </div>
      </ZKCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SettingsInterface } from "src/utils/component/settings/settings";
import ZKCard from "../ui-library/ZKCard.vue";
import ZKHoverEffect from "../ui-library/ZKHoverEffect.vue";

defineProps<{
  settingsItemList: SettingsInterface[];
  title: string;
}>();
</script>

<style scoped lang="scss">
.menuItem {
  display: flex;
  gap: 2rem;
  align-items: center;
  font-size: 1rem;
  cursor: pointer;
  padding: 1rem;
}

.flexStyle {
  display: flex;
  flex-direction: column;
}

.titleStyle {
  font-size: 0.9rem;
  font-weight: bold;
  padding-bottom: 1rem;
}

.container {
  padding-bottom: 2rem;
}

.isWarningStyle {
  color: #b91c1c;
}
</style>
