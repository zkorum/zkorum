import type { GetConversationForEditResponse } from "src/shared/types/dto";
import { useAuthenticationStore } from "src/stores/authentication";
import { getConversationEditFallbackPath } from "src/utils/router/conversationEditReturn";
import { computed, nextTick, readonly, type Ref, ref, watch } from "vue";
import { useRoute } from "vue-router";

type EditableConversation = Extract<
  GetConversationForEditResponse,
  { success: true }
>;

export type EditConversationLoadFailure =
  | Extract<GetConversationForEditResponse, { success: false }>["reason"]
  | "locked"
  | "load_failed";

export interface EditConversationLoadContext {
  conversation: EditableConversation;
  isCurrent: () => boolean;
}

type EditRequest =
  | { status: "pending" }
  | {
      status: "denied";
      reason: Extract<
        GetConversationForEditResponse,
        { success: false }
      >["reason"];
    }
  | { status: "authorized"; conversationSlugId: string; userId: string };

interface EditConversationLoaderOptions {
  conversationSlugId: Readonly<Ref<string>>;
  getConversation: (
    slug: string
  ) => GetConversationForEditResponse | Promise<GetConversationForEditResponse>;
  onReset: () => void;
  onLoaded: (context: EditConversationLoadContext) => void | Promise<void>;
  onReady: () => void | Promise<void>;
  onError: (failure: EditConversationLoadFailure) => Promise<void>;
}

export function useEditConversationLoader({
  conversationSlugId,
  getConversation,
  onReset,
  onLoaded,
  onReady,
  onError,
}: EditConversationLoaderOptions) {
  const auth = useAuthenticationStore();
  const route = useRoute();
  const pageRouteName = route.name;
  const isLoading = ref(true);
  const conversationReturnPath = computed(() =>
    getConversationEditFallbackPath({
      conversationSlugId: conversationSlugId.value,
      returnTo: route.query.returnTo,
    })
  );
  const request = computed<EditRequest>(() => {
    // A new tab's initial signed-out state is not an authorization decision.
    // An outgoing page must also stop reacting before it finishes unmounting.
    if (route.name !== pageRouteName || !auth.isAuthInitialized) {
      return { status: "pending" };
    }
    if (!conversationSlugId.value) {
      return { status: "denied", reason: "not_found" };
    }
    const userId = auth.userId;
    if (!auth.isLoggedIn || userId === undefined) {
      return { status: "denied", reason: "not_author" };
    }
    return {
      status: "authorized",
      conversationSlugId: conversationSlugId.value,
      userId,
    };
  });

  watch(
    request,
    async (currentRequest, _previousRequest, onCleanup) => {
      let active = true;
      onCleanup(() => {
        active = false;
      });
      const isCurrent = () => active && request.value === currentRequest;
      isLoading.value = true;
      onReset();
      if (currentRequest.status === "pending") return;

      let failure: EditConversationLoadFailure | undefined;
      if (currentRequest.status === "denied") {
        failure = currentRequest.reason;
      } else {
        try {
          const conversation = await getConversation(
            currentRequest.conversationSlugId
          );
          if (!isCurrent()) return;
          if (!conversation.success) {
            failure = conversation.reason;
          } else if (conversation.isLocked) {
            failure = "locked";
          } else {
            await onLoaded({ conversation, isCurrent });
          }
        } catch {
          if (!isCurrent()) return;
          // Request errors can contain authorization headers and private data.
          console.error("Failed to load conversation editor");
          failure = "load_failed";
        }
      }

      if (!isCurrent()) return;
      // Keep navigation outside the data-loading catch so navigation failures
      // cannot cause a second toast and another redirect.
      if (failure !== undefined) {
        // Recovery must be able to unlock the shared layout's mounted guard.
        await nextTick();
        if (!isCurrent()) return;
        await onError(failure);
      } else {
        isLoading.value = false;
        await onReady();
      }
    },
    { immediate: true }
  );

  return { isLoading: readonly(isLoading), conversationReturnPath };
}
