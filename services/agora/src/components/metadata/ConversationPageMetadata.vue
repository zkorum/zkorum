<template>
  <PageMetadata :policy="policy" />
</template>

<script setup lang="ts">
import { useConversationQuery } from "src/utils/api/post/useConversationQuery";
import type { PageMetadataPolicy } from "src/utils/html/pageMetadata";
import { computed } from "vue";

import PageMetadata from "./PageMetadata.vue";

const props = defineProps<{ conversationSlugId: string }>();
// Observe page-owned data without initiating fetches: the API wrapper can
// redirect or notify on errors, which document metadata must not trigger.
const conversationQuery = useConversationQuery({
  conversationSlugId: () => props.conversationSlugId,
  enabled: false,
});
const policy = computed<PageMetadataPolicy>(() => {
  const metadata = conversationQuery.data.value?.conversationData.metadata;
  const currentMetadata =
    metadata?.conversationSlugId === props.conversationSlugId
      ? metadata
      : undefined;

  return {
    robots:
      currentMetadata?.isIndexed === true ? undefined : "noindex, nofollow",
    browserTranslationAllowed:
      currentMetadata?.multilingualSetting.dynamicTranslationEnabled === false,
  };
});
</script>
