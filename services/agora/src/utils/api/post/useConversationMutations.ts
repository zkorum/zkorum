import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { UpdateConversationRequest } from "src/shared/types/dto";
import type { ExtendedConversation } from "src/shared/types/zod";
import { useAuthenticationStore } from "src/stores/authentication";
import { useLanguageStore } from "src/stores/language";
import { useUserStore } from "src/stores/user";
import { cacheCreatedSeedOpinions } from "src/utils/api/comment/createdOpinionCache";
import type { OpinionQueryScope } from "src/utils/api/comment/opinionQueryScope";
import { invalidateConversationContentQueries } from "src/utils/api/contentTranslation/conversationContentQuery";
import { applyConversationProjectAssignment } from "src/utils/api/post/conversationProjectCache";
import { useBackendPostApi } from "src/utils/api/post/post";
import { useBackendPostEditApi } from "src/utils/api/post/postEdit";
import { createSavedSeedOpinionChanges } from "src/utils/api/post/savedSeedOpinionChanges";
import {
  type ConversationMutationsTranslations,
  conversationMutationsTranslations,
} from "src/utils/api/post/useConversationMutations.i18n";
import {
  type ConversationDetail,
  updateConversationQueryCache,
} from "src/utils/api/post/useConversationQuery";
import { useViewerQueryScope } from "src/utils/query/viewerScope";
import { useNotify } from "src/utils/ui/notify";
import { onScopeDispose, watch } from "vue";

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
  const { updateConversation, refreshConversationMetadata } =
    useBackendPostEditApi();
  const viewerScope = useViewerQueryScope();
  const userStore = useUserStore();
  const { displayLanguage, spokenLanguages } = storeToRefs(useLanguageStore());
  let seedSaveGeneration = 0;
  watch(
    [
      () => auth.userId,
      () => auth.isLoggedIn,
      displayLanguage,
      spokenLanguages,
    ],
    () => {
      seedSaveGeneration += 1;
    },
    { flush: "sync", deep: true }
  );
  onScopeDispose(() => {
    seedSaveGeneration += 1;
  });

  return useMutation({
    mutationFn: (data: UpdateConversationRequest) => updateConversation(data),

    onMutate: async (variables) => {
      const viewerUserId = auth.userId;
      const generation = seedSaveGeneration;
      const changedSeedSlugs = new Set(
        (variables.seedOpinionChanges ?? []).map((change) => change.slugId)
      );
      const profileBeforeSave = new Map(
        (changedSeedSlugs.size === 0
          ? []
          : userStore.profileData.userCommentList
        )
          .filter((item) =>
            changedSeedSlugs.has(item.opinionItem.opinionSlugId)
          )
          .map((item) => [
            item.opinionItem.opinionSlugId,
            { ...item.opinionItem },
          ])
      );
      const opinionScope: OpinionQueryScope = {
        viewerUserId,
        displayLanguage: displayLanguage.value,
        spokenLanguages: [...spokenLanguages.value],
      };
      const polisSettings =
        variables.conversationTypeConfig.conversationType === "polis"
          ? variables.conversationTypeConfig
          : undefined;
      await queryClient.cancelQueries({
        queryKey: ["conversation", variables.conversationSlugId],
      });

      const previousConversations = queryClient.getQueriesData<
        ExtendedConversation | ConversationDetail
      >({ queryKey: ["conversation", variables.conversationSlugId] });
      const previousMetadata = previousConversations.flatMap(([, previous]) =>
        previous === undefined
          ? []
          : [
              "conversationData" in previous
                ? previous.conversationData.metadata
                : previous.metadata,
            ]
      );
      const aiLabelingEnabledChanged =
        polisSettings?.aiLabelingEnabled !== undefined &&
        (previousMetadata.length === 0 ||
          previousMetadata.some(
            (metadata) =>
              metadata.aiLabelingEnabled !== polisSettings.aiLabelingEnabled
          ));
      const preferredOpinionGroupCountChanged =
        polisSettings?.preferredOpinionGroupCount !== undefined &&
        (previousMetadata.length === 0 ||
          previousMetadata.some(
            (metadata) =>
              metadata.preferredOpinionGroupCount !==
              polisSettings.preferredOpinionGroupCount
          ));

      updateConversationQueryCache({
        queryClient,
        conversationSlugId: variables.conversationSlugId,
        updateConversation: (oldData) => {
          const updatedData = {
            metadata: {
              ...oldData.metadata,
              ...(oldData.metadata.conversationType === "polis" &&
              polisSettings !== undefined
                ? { votingPresentation: polisSettings.votingPresentation }
                : {}),
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

      return {
        rollback: () => {
          if (auth.userId !== viewerUserId) return;
          for (const [queryKey, previous] of previousConversations) {
            // A failed request must not repopulate caches cleared during logout.
            queryClient.setQueryData<ExtendedConversation | ConversationDetail>(
              queryKey,
              (current) => (current === undefined ? undefined : previous)
            );
          }
        },
        aiLabelingEnabledChanged,
        preferredOpinionGroupCountChanged,
        viewerUserId,
        opinionScope,
        generation,
        profileBeforeSave,
      };
    },

    onSuccess: async (data, variables, context) => {
      if (data.success) {
        await cacheCreatedSeedOpinions({
          queryClient,
          conversationSlugId: variables.conversationSlugId,
          opinions: data.addedOpinions ?? [],
          viewerUserId: context?.viewerUserId,
        });
        const hasExistingSeedChanges =
          (variables.seedOpinionChanges?.length ?? 0) > 0;
        if (
          (data.addedSeedOpinions?.length ?? 0) > 0 ||
          hasExistingSeedChanges
        ) {
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
              hasExistingSeedChanges ||
              state.data === undefined ||
              !["discover", "new"].includes(String(queryKey[2])),
            refetchType: "none",
          });
          if (hasExistingSeedChanges) {
            for (const change of variables.seedOpinionChanges ?? []) {
              void queryClient.invalidateQueries({
                queryKey: ["opinionTarget", change.slugId],
                refetchType: "none",
              });
            }
            if (
              context !== undefined &&
              context.generation === seedSaveGeneration &&
              auth.userId === context.viewerUserId
            ) {
              const saved = createSavedSeedOpinionChanges({
                changes: variables.seedOpinionChanges ?? [],
                opinions: data.updatedOpinions ?? [],
              });
              saved.updateCache({
                queryClient,
                conversationSlugId: variables.conversationSlugId,
                scope: context.opinionScope,
              });
              userStore.profileData.userCommentList = saved.updateProfile({
                items: userStore.profileData.userCommentList,
                beforeSave: context.profileBeforeSave,
              });
            }
          }
        }
        await invalidateConversationContentQueries({
          queryClient,
          conversationSlugId: variables.conversationSlugId,
        });
        if (data.projectAssignment !== undefined) {
          // Keep the committed scope authoritative over an immediate replica refresh.
          void applyConversationProjectAssignment({
            queryClient,
            conversationSlugId: variables.conversationSlugId,
            assignment: data.projectAssignment,
            viewerScope: viewerScope.value,
            isCurrent: () => auth.userId === context?.viewerUserId,
            refreshMetadata: () =>
              refreshConversationMetadata({
                conversationSlugId: variables.conversationSlugId,
                authenticated: auth.isGuestOrLoggedIn,
              }),
          });
        }
        void queryClient.invalidateQueries({
          queryKey: ["feed"],
          refetchType: "none",
        });
        if (
          context?.preferredOpinionGroupCountChanged === true ||
          context?.aiLabelingEnabledChanged === true
        ) {
          void queryClient.invalidateQueries({
            queryKey: ["analysisFrameManifest", variables.conversationSlugId],
            refetchType: "none",
          });
        }
        if (context?.aiLabelingEnabledChanged === true) {
          void queryClient.invalidateQueries({
            queryKey: [
              "analysisFrameGroupLabels",
              variables.conversationSlugId,
            ],
            refetchType: "none",
          });
        }
        void queryClient.invalidateQueries({
          queryKey: ["analysis", variables.conversationSlugId],
        });
      } else {
        context?.rollback();
        void queryClient.invalidateQueries({
          queryKey: ["conversation", variables.conversationSlugId],
        });
      }
    },

    onError: (_error, _variables, context) => {
      context?.rollback();
    },

    retry: false,
  });
}
