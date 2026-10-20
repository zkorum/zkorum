import { QueryClient, useQuery, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { useAuthenticationStore } from "src/stores/authentication";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, nextTick } from "vue";

import { useInvalidateParticipationAfterPreference } from "./useConversationEmailUpdateQueries";

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

function mountInvalidator() {
  const queryClient = new QueryClient();
  const pinia = createPinia();
  useAuthenticationStore(pinia).setLoginStatus({
    isKnown: true,
    userId: "viewer",
    isLoggedIn: true,
  });
  const currentKey = [
    "participation-status",
    "current",
    { kind: "viewer", userId: "viewer" },
  ];
  const affectedKey = [
    "participation-status",
    "affected",
    { kind: "viewer", userId: "viewer" },
  ];
  const unrelatedKey = [
    "participation-status",
    "unrelated",
    { kind: "viewer", userId: "viewer" },
  ];
  const otherViewerKey = [
    "participation-status",
    "affected",
    { kind: "viewer", userId: "other" },
  ];
  const keys = [currentKey, affectedKey, unrelatedKey, otherViewerKey];
  for (const key of keys) queryClient.setQueryData(key, { status: "ready" });
  const read = vi.fn(() => Promise.resolve({ status: "ready" }));
  let invalidate:
    | ReturnType<typeof useInvalidateParticipationAfterPreference>
    | undefined;
  const app = createApp({
    setup() {
      invalidate = useInvalidateParticipationAfterPreference();
      for (const queryKey of keys)
        useQuery({ queryKey, queryFn: read, staleTime: Infinity });
      return () => null;
    },
  });
  app.use(pinia);
  app.use(VueQueryPlugin, { queryClient });
  app.mount(document.createElement("div"));
  cleanups.push(() => {
    app.unmount();
    queryClient.clear();
  });
  if (invalidate === undefined) throw new Error("Invalidation was not mounted");
  return {
    invalidate,
    queryClient,
    read,
    currentKey,
    affectedKey,
    unrelatedKey,
    otherViewerKey,
  };
}

describe("preference-write participation invalidation", () => {
  it("preserves the write-returned current snapshot and avoids HTTP fan-out", async () => {
    const {
      invalidate,
      queryClient,
      read,
      currentKey,
      affectedKey,
      otherViewerKey,
    } = mountInvalidator();
    invalidate({
      result: {
        operation: "set_project_preference",
        projectSlug: "project",
        state: "enabled",
        globalResumed: false,
      },
      preserveConversationSlugId: "current",
    });
    await nextTick();
    expect(queryClient.getQueryState(currentKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(affectedKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(otherViewerKey)?.isInvalidated).toBe(
      false
    );
    expect(read).not.toHaveBeenCalled();
  });

  it("targets the returned conversation list when no project or global preference changed", async () => {
    const { invalidate, queryClient, read, affectedKey, unrelatedKey } =
      mountInvalidator();
    invalidate({
      result: {
        operation: "set_conversation_preference",
        globalResumed: false,
        conversationPreferences: [
          {
            conversationSlugId: "affected",
            state: "disabled",
            resolvedEnabled: false,
          },
        ],
      },
      preserveConversationSlugId: undefined,
    });
    await nextTick();
    expect(queryClient.getQueryState(affectedKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
    expect(read).not.toHaveBeenCalled();
  });
});
