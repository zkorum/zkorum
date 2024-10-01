<template>
  <div>

    <div class="topBar">
      <ZKButton icon="mdi-logout" label="Logout" @click="logoutRequested()" />
    </div>

    <div class="profileDetails">
      <div>
        100 comments <span class="dotPadding">•</span>
      </div>
      <div>
        1000 votes <span class="dotPadding">•</span>
      </div>
      <div>
        Jan 1, 2024
      </div>
    </div>


    <Tabs value="0">
      <TabList>
        <Tab value="0">Comments</Tab>
        <Tab value="1">Votes</Tab>
      </TabList>
      <TabPanel value="0">
        <div :style="{paddingTop: '1rem'}">
          <CompactCommentList />
        </div>
      </TabPanel>
      <TabPanel value="1">
        <div :style="{ paddingTop: '1rem' }">
        </div>
      </TabPanel>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import Tabs from "primevue/tabs";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import CompactCommentList from "src/components/profile/CompactCommentList.vue";
import ZKButton from "src/components/ui-library/ZKButton.vue";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import { useAuthenticationStore } from "src/stores/authentication";
import { useBackendAuthApi } from "src/utils/api/auth";
import { getPlatform } from "src/utils/common";
import { useRouter } from "vue-router";

const { isAuthenticated } = storeToRefs(useAuthenticationStore());

const $q = useQuasar();

const backendAuth = useBackendAuthApi();
const router = useRouter();

function logoutRequested() {
  backendAuth.logout("test@gmail.com", getPlatform($q.platform));
  isAuthenticated.value = false;
  router.push("default-home-feed");
}

</script>

<style scoped lang="scss">
.profileDetails {
  display:flex;
  flex-wrap: wrap;
  color: $color-text-strong;
  font-size: 0.9rem;
}

.dotPadding {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.topBar {
  display: flex;
  justify-content: right;
  padding-top: 0.5rem;
}

</style>
