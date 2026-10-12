import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useRouteQuery } from "@vueuse/router";
import { storeToRefs } from "pinia";
import { useComponentI18n } from "src/composables/ui/useComponentI18n";
import type { DisplayedOpinionItem, OpinionItem } from "src/shared/types/zod";
import { useAuthenticationStore } from "src/stores/authentication";
import { useLanguageStore } from "src/stores/language";
import { useBackendCommentApi } from "src/utils/api/comment/comment";
import type { OpinionQueryScope } from "src/utils/api/comment/opinionQueryScope";
import { getOpinionTargetQueryKey } from "src/utils/api/comment/opinionTargetQueryKey";
import { useNotify } from "src/utils/ui/notify";
import { computed, nextTick, onScopeDispose, type Ref, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  type UseTargetOpinionTranslations,
  useTargetOpinionTranslations,
} from "./useTargetOpinion.i18n";

export interface UseTargetOpinionReturn {
  targetOpinion: Ref<DisplayedOpinionItem | null>;
  setupHighlightFromRoute: () => Promise<void>;
  highlightOpinion: (opinion: DisplayedOpinionItem) => void;
  getCachedOpinion: (opinion: DisplayedOpinionItem) => DisplayedOpinionItem;
  clearRouteQueryParameters: () => Promise<void>;
}

interface UseTargetOpinionParams {
  onModeratedOpinionDetected?: (opinion: OpinionItem) => void;
}

export function useTargetOpinion({
  onModeratedOpinionDetected,
}: UseTargetOpinionParams = {}): UseTargetOpinionReturn {
  const router = useRouter();
  const route = useRoute();
  const targetOpinion = ref<DisplayedOpinionItem | null>(null);
  const { showNotifyMessage } = useNotify();

  const { t } = useComponentI18n<UseTargetOpinionTranslations>(
    useTargetOpinionTranslations
  );

  const opinionSlugIdQuery = useRouteQuery("opinion", "", {
    transform: String,
  });

  const { fetchOpinionsBySlugIdList } = useBackendCommentApi();
  const queryClient = useQueryClient();
  const { userId } = storeToRefs(useAuthenticationStore());
  const { displayLanguage, spokenLanguages } = storeToRefs(useLanguageStore());
  const selectedSlugId = ref("");
  let contextGeneration = 0;
  function captureScope(): OpinionQueryScope {
    return {
      viewerUserId: userId.value,
      displayLanguage: displayLanguage.value,
      spokenLanguages: [...spokenLanguages.value],
    };
  }
  function queryKey(opinionSlugId: string) {
    return getOpinionTargetQueryKey({
      opinionSlugId,
      viewerUserId: userId.value,
      displayLanguage: displayLanguage.value,
      spokenLanguages: spokenLanguages.value,
    });
  }
  async function loadOpinion({
    opinionSlugId,
    generation,
  }: {
    opinionSlugId: string;
    generation: number;
  }): Promise<DisplayedOpinionItem> {
    const opinion = (await fetchOpinionsBySlugIdList([opinionSlugId])).at(0);
    if (generation !== contextGeneration)
      throw new DOMException("Statement viewer changed", "AbortError");
    if (opinion === undefined) throw new Error("Statement not found");
    return opinion;
  }
  const selectedQuery = useQuery({
    queryKey: computed(() => queryKey(selectedSlugId.value)),
    queryFn: () =>
      loadOpinion({
        opinionSlugId: selectedSlugId.value,
        generation: contextGeneration,
      }),
    enabled: computed(() => selectedSlugId.value !== ""),
    staleTime: 30_000,
  });
  watch(selectedQuery.data, (opinion) => {
    if (
      opinion !== undefined &&
      targetOpinion.value?.opinionSlugId === opinion.opinionSlugId
    )
      targetOpinion.value = opinion;
  });
  watch(
    userId,
    () => {
      targetOpinion.value = null;
      selectedSlugId.value = "";
      contextGeneration += 1;
    },
    { flush: "sync" }
  );
  watch(
    [displayLanguage, spokenLanguages],
    () => {
      contextGeneration += 1;
    },
    { flush: "sync", deep: true }
  );
  onScopeDispose(() => {
    contextGeneration += 1;
  });

  async function clearRouteQueryParameters(): Promise<void> {
    if (Object.keys(route.query).length > 0) {
      await router.replace({
        path: route.path,
        query: {},
      });
    }
  }

  function scrollToOpinion(opinionSlugId: string): void {
    const generation = contextGeneration;
    void nextTick(() => {
      if (
        generation !== contextGeneration ||
        targetOpinion.value?.opinionSlugId !== opinionSlugId
      )
        return;
      const element = document.getElementById(`comment-${opinionSlugId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  async function setupHighlightFromRoute(): Promise<void> {
    const opinionSlugId = opinionSlugIdQuery.value;
    if (opinionSlugId && opinionSlugId.trim() !== "") {
      await fetchTargetOpinion(opinionSlugId);
      if (targetOpinion.value) {
        scrollToOpinion(opinionSlugId);
      }
    }
  }

  async function fetchTargetOpinion(opinionSlugId: string): Promise<void> {
    if (opinionSlugId === "") {
      return;
    }

    try {
      selectedSlugId.value = opinionSlugId;
      const generation = contextGeneration;
      const scope = captureScope();
      const opinion = await queryClient.fetchQuery({
        queryKey: getOpinionTargetQueryKey({ opinionSlugId, ...scope }),
        queryFn: () => loadOpinion({ opinionSlugId, generation }),
        staleTime: 30_000,
      });
      if (
        generation !== contextGeneration ||
        selectedSlugId.value !== opinionSlugId
      )
        return;
      targetOpinion.value = opinion;
      if (opinion.moderation.status === "moderated")
        onModeratedOpinionDetected?.(opinion);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Error fetching target opinion:", error);
      showNotifyMessage(t("statementNotFound"));
    }
  }

  function highlightOpinion(opinion: DisplayedOpinionItem): void {
    selectedSlugId.value = opinion.opinionSlugId;
    queryClient.setQueryData(queryKey(opinion.opinionSlugId), opinion);
    targetOpinion.value = opinion;
    scrollToOpinion(opinion.opinionSlugId);
  }

  function getCachedOpinion(
    opinion: DisplayedOpinionItem
  ): DisplayedOpinionItem {
    return (
      queryClient.getQueryData<DisplayedOpinionItem>(
        queryKey(opinion.opinionSlugId)
      ) ?? opinion
    );
  }

  return {
    targetOpinion,
    setupHighlightFromRoute,
    highlightOpinion,
    getCachedOpinion,
    clearRouteQueryParameters,
  };
}
