<template>
  <div>
    <q-layout
      view="hHh lpR fFf"
      :class="{ bottomPagePadding: addBottomPadding }"
    >
      <q-page-container>
        <q-page>
          <router-view v-if="enableHeader" name="topmenubar" />

          <WidthWrapper :width="reducedWidth ? '25rem' : '35rem'">
            <router-view />
          </WidthWrapper>
        </q-page>
      </q-page-container>

      <q-footer v-if="enableFooter" bordered class="coloredFooter">
        <FooterBar />
      </q-footer>
    </q-layout>
  </div>
</template>

<script setup lang="ts">
import FooterBar from "src/components/footer/FooterBar.vue";
import WidthWrapper from "src/components/navigation/WidthWrapper.vue";
import { type MainLayoutProps } from "src/utils/model/props";

defineProps<MainLayoutProps>();
</script>

<style scoped lang="scss">
.outerPadding {
  padding: 0.5rem;
}

.coloredFooter {
  background-color: $navigation-bar-color;
}

.bottomPagePadding {
  padding-bottom: 10rem;
}
</style>
