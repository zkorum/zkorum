<template>
  <div>
    <div class="container">
      <div class="titleStyle">
        {{ title }}
      </div>

      <ZKCard padding="1rem">
        <div class="flexStyle">
          <div v-for="(item, index) in settingsItemList" :key="item.icon">
            <RouterLink :to="{ name: item.routeName }">
              <div class="menuItem" @click="item.action">
                <div>
                  <q-icon :name="item.icon" size="1.5rem" />
                </div>
                <div>
                  {{ item.label }}
                </div>
              </div>

              <q-separator v-if="index != settingsItemList.length - 1" class="separatorStyle" />
            </RouterLink>
          </div>
        </div>
      </ZKCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SettingsInterface } from "src/utils/component/settings/settings";
import ZKCard from "../ui-library/ZKCard.vue";

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

.separatorStyle {
  margin-top: 0.8rem;
  margin-bottom: 0.8rem;
}
</style>
