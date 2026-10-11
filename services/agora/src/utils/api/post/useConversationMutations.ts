import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { UpdateConversationRequest } from "src/shared/types/dto";
import { useAuthenticationStore } from "src/stores/authentication";
import { cacheCreatedSeedOpinions } from "src/utils/api/comment/createdOpinionCache";
import { invalidateConversationContentQueries } from "src/utils/api/contentTranslation/conversationContentQuery";
import { applyConversationProjectAssignment } from "src/utils/api/post/conversationProjectCache";
import { useBackendPostApi } from "src/utils/api/post/post";
import { useBackendPostEditApi } from "src/utils/api/post/postEdit";
import {
  type ConversationMutationsTranslations,
  conversationMutationsTranslations,
} from "src/utils/api/post/useConversationMutations.i18n";
import { updateConversationQueryCache } from "src/utils/api/post/useConversationQuery";
import { useNotify } from "src/utils/ui/notify";

export function useCloseConversationMutation() {
  const queryClient = useQueryClient();
  const { closeConversation } = useBackendPostApi();
  const { showNotifyMessage } = useNotify();
  const { t } = useComponentI18n<ConversationMutationsTranslations>(
    conversationMutationsTranslations
  );

  return useMutation({
    mutationFn: ({ conversationSlugId }: { conversationSlugId: string }) => {
      return closeConversation({ conversationSlugId });
    },

    // Optimistic update: update cache BEFORE backend responds
    onMutate: async ({ conversationSlugId }) => {
      // Cancel outgoing refetches to prevent them from overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ["conversation", conversationSlugId],
      });

      // Snapshot previous values for rollback
      const previousConversations = queryClient.getQueriesData({
        queryKey: ["conversation", conversationSlugId],
      });

      updateConversationQueryCache({
        queryClient,
        conversationSlugId,
        updateConversation: (oldData) => ({
          metadata: {
            ...oldData.metadata,
            isClosed: true,
          },
        }),
      });

      return { previousConversations };
    },

    onSuccess: (data, { conversationSlugId }) => {
      if (data.success) {
        showNotifyMessage(t("closeSuccess"));

        // Optimistic update was correct, mark feed as stale for next visit
        void queryClient.invalidateQueries({
          queryKey: ["feed"],
          refetchType: "none",
        });
      } else {
        // Handle error reasons
        if (data.reason === "not_allowed") {
          showNotifyMessage(t("closeNotAllowed"));
        } else if (data.reason === "already_closed") {
          showNotifyMessage(t("alreadyClosed"));
        }

        // Invalidate conversation to get fresh state from server
        void queryClient.invalidateQueries({
          queryKey: ["conversation", conversationSlugId],
        });
      }
    },

    onError: (_error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousConversations) {
        for (const [queryKey, data] of context.previousConversations) {
          queryClient.setQueryData(queryKey, data);
        }
      }

      showNotifyMessage(t("closeError"));
    },

    retry: false,
  });
}

export function useOpenConversationMutation() {
  const queryClient = useQueryClient();
  const { openConversation } = useBackendPostApi();
  const { showNotifyMessage } = useNotify();
  const { t } = useComponentI18n<ConversationMutationsTranslations>(
    conversationMutationsTranslations
  );

  return useMutation({
    mutationFn: ({ conversationSlugId }: { conversationSlugId: string }) => {
      return openConversation({ conversationSlugId });
    },

    // Optimistic update: update cache BEFORE backend responds
    onMutate: async ({ conversationSlugId }) => {
      // Cancel outgoing refetches to prevent them from overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: ["conversation", conversationSlugId],
      });

      // Snapshot previous values for rollback
      const previousConversations = queryClient.getQueriesData({
        queryKey: ["conversation", conversationSlugId],
      });

      updateConversationQueryCache({
        queryClient,
        conversationSlugId,
        updateConversation: (oldData) => ({
          metadata: {
            ...oldData.metadata,
            isClosed: false,
          },
        }),
      });

      return { previousConversations };
    },

    onSuccess: (data, { conversationSlugId }) => {
      if (data.success) {
        showNotifyMessage(t("openSuccess"));

        // Optimistic update was correct, mark feed as stale for next visit
        void queryClient.invalidateQueries({
          queryKey: ["feed"],
          refetchType: "none",
        });
      } else {
        // Handle error reasons
        if (data.reason === "not_allowed") {
          showNotifyMessage(t("openNotAllowed"));
        } else if (data.reason === "already_open") {
          showNotifyMessage(t("alreadyOpen"));
        }

        // Invalidate conversation to get fresh state from server
        void queryClient.invalidateQueries({
          queryKey: ["conversation", conversationSlugId],
        });
      }
    },

    onError: (_error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousConversations) {
        for (const [queryKey, data] of context.previousConversations) {
          queryClient.setQueryData(queryKey, data);
        }
      }

      showNotifyMessage(t("openError"));
    },

    retry: false,
  });
}

export function useUpdateConversationMutation() {
  const auth = useAuthenticationStore();
  const queryClient = useQueryClient();
  const { updateConversation } = useBackendPostEditApi();

  return useMutation({
    mutationFn: (data: UpdateConversationRequest) => updateConversation(data),

    onMutate: async (variables) => {
      const viewerUserId = auth.userId;
      const polisSettings =
        variables.conversationTypeConfig.conversationType === "polis"
          ? variables.conversationTypeConfig
          : undefined;
      await queryClient.cancelQueries({
        queryKey: ["conversation", variables.conversationSlugId],
      });

      const previousConversations = queryClient.getQueriesData({
        queryKey: ["conversation", variables.conversationSlugId],
      });

      updateConversationQueryCache({
        queryClient,
        conversationSlugId: variables.conversationSlugId,
        updateConversation: (oldData) => {
          const updatedData = {
            metadata: {
              ...oldData.metadata,
              isIndexed: variables.isIndexed,
              aiLabelingEnabled:
                polisSettings?.aiLabelingEnabled ??
                oldData.metadata.aiLabelingEnabled,
              preferredOpinionGroupCount:
                polisSettings?.preferredOpinionGroupCount === undefined
                  ? oldData.metadata.preferredOpinionGroupCount
                  : polisSettings.preferredOpinionGroupCount,
              participationMode: variables.participationMode,
              requiresEventTicket: variables.requiresEventTicket,
            },
          };

          if (!("payload" in oldData)) {
            return updatedData;
          }

          return {
            ...updatedData,
            payload: {
              ...oldData.payload,
              title: variables.conversationTitle,
              body: variables.conversationBody,
            },
          };
        },
      });

      return { previousConversations, viewerUserId };
    },

    onSuccess: async (data, variables, context) => {
      if (data.success) {
        await cacheCreatedSeedOpinions({
          queryClient,
          conversationSlugId: variables.conversationSlugId,
          opinions: data.addedOpinions ?? [],
          viewerUserId: context?.viewerUserId,
        });
        if ((data.addedSeedOpinions?.length ?? 0) > 0) {
          for (const family of [
            "commentStats",
            "analysisFrameManifest",
            "maxdiff-items",
            "maxdiff-load",
            "ranking-stats-checkpoints",
          ]) {
            void queryClient.invalidateQueries({
              queryKey: [family, variables.conversationSlugId],
              refetchType: "none",
            });
          }
          void queryClient.invalidateQueries({
            queryKey: ["comments", variables.conversationSlugId],
            predicate: ({ queryKey, state }) =>
              state.data === undefined ||
              !["discover", "new"].includes(String(queryKey[2])),
            refetchType: "none",
          });
        }
        await invalidateConversationContentQueries({
          queryClient,
          conversationSlugId: variables.conversationSlugId,
        });
        if (data.projectAssignment !== undefined) {
          // Keep the committed scope authoritative over an immediate replica refresh.
          await applyConversationProjectAssignment({
            queryClient,
            conversationSlugId: variables.conversationSlugId,
            assignment: data.projectAssignment,
          });
        }
        void queryClient.invalidateQueries({
          queryKey: ["feed"],
          refetchType: "none",
        });
        void queryClient.invalidateQueries({
          queryKey: ["analysis", variables.conversationSlugId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["analysisMetadata", variables.conversationSlugId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["analysisContent", variables.conversationSlugId],
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: ["conversation", variables.conversationSlugId],
        });
        for (const [queryKey, previous] of context?.previousConversations ?? [])
          queryClient.setQueryData(queryKey, previous);
      }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousConversations) {
        for (const [queryKey, data] of context.previousConversations) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    retry: false,
  });
}
