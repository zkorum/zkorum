<template>
  <div>

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

</script>

<style scoped lang="scss">
.profileDetails {
  display:flex;
  flex-wrap: wrap;
  padding: 1rem;
  color: $color-text-strong;
  font-size: 0.8rem;
}

.dotPadding {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

</style>
