<template>
  <MaxDiffVotingTab
    v-if="
      conversationData !== undefined &&
      conversationData.metadata.conversationType === 'ranking' &&
      conversationData.metadata.rankingMode === 'bws'
    "
    :conversation-data="conversationData"
    :on-view-analysis="onViewAnalysis"
  />
  <ConversationCommentTab
    v-else-if="conversationData !== undefined"
    :conversation-data="conversationData"
    :moderation-history-trigger="moderationHistoryTrigger"
    :comment-filter="commentFilter"
    :on-view-analysis="onViewAnalysis"
    :conversation-route-context="conversationRouteContext"
    :editing-opinion="editingOpinion"
    @edit-opinion="emit('editOpinion', $event)"
    @update:comment-filter="
      (filter: CommentFilterOptions) => emit('update:commentFilter', filter)
    "
  />
</template>

<script setup lang="ts">
import ConversationCommentTab from "src/components/post/ConversationCommentTab.vue";
import MaxDiffVotingTab from "src/components/post/maxdiff/MaxDiffVotingTab.vue";
import type {
  DisplayedOpinionItem,
  ExtendedConversationDisplayData,
} from "src/shared/types/zod";
import type { CommentFilterOptions } from "src/utils/component/opinion";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";

const {
  conversationData,
  moderationHistoryTrigger,
  commentFilter,
  onViewAnalysis,
  conversationRouteContext,
  editingOpinion,
} = defineProps<{
  // Dynamic route props can briefly clear during navigation teardown.
  conversationData: ExtendedConversationDisplayData | undefined;
  moderationHistoryTrigger: number;
  commentFilter: CommentFilterOptions;
  onViewAnalysis: () => void;
  conversationRouteContext: ConversationRouteContext;
  editingOpinion: DisplayedOpinionItem | undefined;
}>();

const emit = defineEmits<{
  editOpinion: [opinion: DisplayedOpinionItem];
  "update:commentFilter": [filter: CommentFilterOptions];
}>();
</script>

<style scoped lang="scss"></style>
