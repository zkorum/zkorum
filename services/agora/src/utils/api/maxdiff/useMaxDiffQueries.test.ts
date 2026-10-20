import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createMaxDiff } from "src/shared/utils/maxdiff";
import type { useMaxDiffApi } from "src/utils/api/maxdiff/maxdiff";
import { participationRejectionFixture } from "src/utils/api/participation/participationTestFixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "vue";

const save = vi.hoisted(() =>
  vi.fn<ReturnType<typeof useMaxDiffApi>["saveMaxDiffResult"]>()
);
vi.mock("./maxdiff", () => ({
  useMaxDiffApi: () => ({ saveMaxDiffResult: save }),
}));
vi.mock("src/utils/api/auth", () => ({
  useBackendAuthApi: () => ({
    ensureParticipationAuthState: () => Promise.resolve(),
  }),
}));

import { useMaxDiffSaveMutation } from "./useMaxDiffQueries";

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  vi.resetAllMocks();
});

describe("MaxDiff participation handoff lifetime", () => {
  it.each([false, true])(
    "always rolls back, but routes only the current onboarding session (current=%s)",
    async (current) => {
      const queryClient = new QueryClient();
      const rollback = vi.fn();
      const blocked = vi.fn();
      let mutation: ReturnType<typeof useMaxDiffSaveMutation> | undefined;
      const app = createApp({
        setup() {
          mutation = useMaxDiffSaveMutation({
            conversationSlugId: "example",
            onRollback: rollback,
            onBlocked: blocked,
            onNetworkError: vi.fn(),
          });
          return () => null;
        },
      });
      app.use(createPinia());
      app.use(VueQueryPlugin, { queryClient });
      app.mount(document.createElement("div"));
      cleanups.push(() => {
        app.unmount();
        queryClient.clear();
      });
      if (mutation === undefined) throw new Error("Mutation was not mounted");
      save.mockResolvedValue({
        status: "success",
        data: participationRejectionFixture("account_required"),
      });
      await mutation.mutateAsync({
        ranking: null,
        comparisons: [],
        isComplete: false,
        context: {
          previousState: createMaxDiff([
            "first",
            "second",
            "third",
          ]).exportState(),
          previousCandidates: ["first", "second", "third"],
          isCurrent: () => true,
          isParticipationCurrent: () => current,
        },
      });
      expect(rollback).toHaveBeenCalledOnce();
      expect(blocked).toHaveBeenCalledTimes(current ? 1 : 0);
      if (current) expect(rollback).toHaveBeenCalledBefore(blocked);
    }
  );
});
