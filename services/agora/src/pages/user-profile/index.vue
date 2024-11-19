<template>
  <div>

    <div class="topBar">

      <UserAvatar :user-name="userName" :size="60" />

      <div class="userName">
        {{ userName }}
      </div>

      <div class="profileMetadataBar">
        <div>{{ commentCount }} comments <span class="dotPadding">•</span></div>
        <div>{{ postCount }} votes <span class="dotPadding">•</span></div>
        <div>{{ createdAt }}</div>
      </div>
    </div>

    <Tabs value="0">
      <TabList>
        <Tab value="0">Comments</Tab>
        <Tab value="1">Votes</Tab>
      </TabList>
      <TabPanel value="0">
        <div class="tabPanelPadding">
          <CompactCommentList />
        </div>
      </TabPanel>
      <TabPanel value="1">
        <div class="tabPanelPadding"></div>
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
import { useBackendUserApi } from "src/utils/api/user";
import { onMounted, ref } from "vue";
import UserAvatar from "src/components/account/UserAvatar.vue";

const { fetchUserProfile } = useBackendUserApi();

const userName = ref("");
const commentCount = ref(0);
const createdAt = ref("");
const postCount = ref(0);

onMounted(async () => {
  const response = await fetchUserProfile();
  if (response) {
    commentCount.value = response.commentCount;
    postCount.value = response.postCount;
    createdAt.value = response.createdAt.toLocaleDateString("en-US", {
      year: "numeric", month: "short",
      day: "numeric"
    });
    userName.value = response.userName;
  }
});

</script>

<style scoped lang="scss">
.profileMetadataBar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  color: $color-text-strong;
  font-size: 0.9rem;
}

.dotPadding {
  padding-left: 0.2rem;
  padding-right: 0.2rem;
}

.topBar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: space-between;
  padding: 0.5rem;
}

.tabPanelPadding {
  padding-top: 0.5rem;
}

.userName {
  font-size: 1.2rem;
}
</style>
