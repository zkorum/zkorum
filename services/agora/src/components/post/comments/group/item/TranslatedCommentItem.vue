<template>
  <CommentItem
    :card-element="cardElement"
    :comment-item="commentItem"
    :post-slug-id="postSlugId"
    :conversation-author-username="conversationAuthorUsername"
    :conversation-organization-name="conversationOrganizationName"
    :voting-utilities="votingUtilities"
    :participation-mode="participationMode"
    :requires-event-ticket="requiresEventTicket"
    :survey-gate="surveyGate"
    :on-view-analysis="onViewAnalysis"
    :is-voting-disabled="isVotingDisabled"
    :show-vote-results="showVoteResults"
    :content-translation="translationPreview"
    :conversation-route-context="conversationRouteContext"
    :editing-opinion-slug-id="editingOpinionSlugId"
    @edit-opinion="emit('editOpinion', $event)"
    @update:content-translation-mode="setTranslationMode"
    @deleted="emit('deleted', $event)"
    @muted-comment="emit('mutedComment')"
  />
</template>

<script setup lang="ts">
import type {
  OpinionEditRequest,
  OpinionVotingUtilities,
} from "src/composables/opinion/types";
import type {
  DisplayedOpinionItem,
  EventSlug,
  ParticipationMode,
  SurveyGateSummary,
} from "src/shared/types/zod";
import type { ConversationRouteContext } from "src/utils/router/conversationRouteContext";
import { useOpinionItemDisplayContent } from "src/utils/translation/useOpinionItemDisplayContent";
import { computed } from "vue";

import CommentItem from "./CommentItem.vue";

const props = defineProps<{
  cardElement: HTMLElement | undefined;
  commentItem: DisplayedOpinionItem;
  editingOpinionSlugId: string | undefined;
  postSlugId: string;
  conversationAuthorUsername: string;
  conversationOrganizationName: string;
  votingUtilities: OpinionVotingUtilities;
  participationMode: ParticipationMode;
  requiresEventTicket?: EventSlug;
  surveyGate: SurveyGateSummary | undefined;
  onViewAnalysis: () => void;
  isVotingDisabled: boolean;
  showVoteResults: boolean;
  conversationRouteContext: ConversationRouteContext;
}>();

const emit = defineEmits<{
  deleted: [opinionSlugId: string];
  editOpinion: [request: OpinionEditRequest];
  mutedComment: [];
}>();

const { translationPreview, setTranslationMode } = useOpinionItemDisplayContent(
  {
    conversationSlugId: computed(() => props.postSlugId),
    opinionItem: computed(() => props.commentItem),
  }
);
</script>
