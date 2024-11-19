<template>
  <div>

    <div class="topBar">

      <UserAvatar :user-name="profileData.userName" :size="60" />

      <div class="userName">
        {{ profileData.userName }}
      </div>

      <div class="profileMetadataBar">
        <div>{{ profileData.postCount }} posts <span class="dotPadding">•</span></div>
        <div>{{ profileData.commentCount }} comments <span class="dotPadding">•</span></div>
        <div>{{ profileCreateDateString }}</div>
      </div>
    </div>

    <Tabs value="0">
      <TabList>
        <Tab value="0">Posts</Tab>
        <Tab value="1">Comments</Tab>
      </TabList>
      <TabPanel value="0">
        <div class="tabPanelPadding"></div>
      </TabPanel>
      <TabPanel value="1">
        <div class="tabPanelPadding">
          <CompactCommentList />
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
import UserAvatar from "src/components/account/UserAvatar.vue";
import { useUserStore } from "src/stores/user";
import { computed } from "vue";

const { profileData } = useUserStore();

const profileCreateDateString = computed(() => {
  return getDateString(profileData.value.createdAt);
});

function getDateString(dateObject: Date) {
  const parsedDate = new Date(dateObject);
  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric", month: "short",
    day: "numeric"
  });
}

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
