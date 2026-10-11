import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type EffectScope,
  effectScope,
  type MaybeRefOrGetter,
  nextTick,
  ref,
} from "vue";

import type { SSEContentTranslationUpdatedData } from "../../shared/types/sse";
import { publishContentTranslationEvent } from "./contentTranslationEvents";
import {
  type ContentTranslationSubscription,
  contentTranslationSubscriptions,
  getContentTranslationTopic,
} from "./contentTranslationSubscriptions";
import {
  type ContentTranslationRefreshOutcome,
  isContentTranslationEventForIdentity,
  useContentTranslationRecovery,
} from "./useContentTranslationRecovery";

function createEvent({
  status = "completed",
  timestamp = 1,
  opinionSlugId = "opinion",
}: {
  status?: "completed" | "failed";
  timestamp?: number;
  opinionSlugId?: string;
} = {}): SSEContentTranslationUpdatedData {
  return {
    subject: {
      kind: "opinion",
      conversationSlugId: "conversation",
      opinionSlugId,
      sourceVersion: "00000000-0000-4000-8000-000000000001",
    },
    targetLanguageCode: "en",
    status,
    timestamp,
  };
}

const scopes: EffectScope[] = [];
const defaultSubscription = {
  kind: "conversation",
  conversationSlugId: "conversation",
  targetLanguageCode: "en",
} satisfies ContentTranslationSubscription;

function mountRecovery(
  params: Omit<
    Parameters<typeof useContentTranslationRecovery>[0],
    "subscription"
  > & {
    subscription?: MaybeRefOrGetter<ContentTranslationSubscription | undefined>;
  }
) {
  const scope = effectScope();
  scopes.push(scope);
  const recovery = scope.run(() =>
    useContentTranslationRecovery({
      subscription: defaultSubscription,
      ...params,
    })
  );
  if (recovery === undefined) throw new Error("Test scope did not initialize");
  return { recovery, scope };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useContentTranslationRecovery", () => {
  it("matches the complete subject revision and target language", () => {
    const data = createEvent();
    const subject = data.subject;

    expect(
      isContentTranslationEventForIdentity({
        data,
        subject,
        targetLanguageCode: "en",
      })
    ).toBe(true);
    expect(
      isContentTranslationEventForIdentity({
        data,
        subject: {
          ...subject,
          sourceVersion: "00000000-0000-4000-8000-000000000002",
        },
        targetLanguageCode: "en",
      })
    ).toBe(false);
    expect(
      isContentTranslationEventForIdentity({
        data,
        subject,
        targetLanguageCode: "fr",
      })
    ).toBe(false);
  });

  it("polls each second for five seconds, then backs off until content settles", async () => {
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockResolvedValue("pending");
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
    });

    expect(contentTranslationSubscriptions.topics.value).toEqual([
      getContentTranslationTopic(defaultSubscription),
    ]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(refresh).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(refresh).toHaveBeenCalledTimes(6);
    refresh.mockResolvedValueOnce("settled");
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(refresh).toHaveBeenCalledTimes(7);
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);
  });

  it("keeps a one-second start cadence without overlapping reads when the API takes 600ms", async () => {
    const startedAt = performance.now();
    const requestStarts: number[] = [];
    let activeReads = 0;
    let maxActiveReads = 0;
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh: async () => {
        requestStarts.push(performance.now() - startedAt);
        activeReads += 1;
        maxActiveReads = Math.max(maxActiveReads, activeReads);
        await new Promise<void>((resolve) => setTimeout(resolve, 600));
        activeReads -= 1;
        return requestStarts.length === 5 ? "settled" : "pending";
      },
      onFailure: vi.fn(),
    });

    await vi.advanceTimersByTimeAsync(5_600);
    expect(requestStarts).toEqual([1_000, 2_000, 3_000, 4_000, 5_000]);
    expect(maxActiveReads).toBe(1);
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);
  });

  it("does not overlap slow reads or extend the fast window by their duration", async () => {
    const first = Promise.withResolvers<ContentTranslationRefreshOutcome>();
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue("settled");
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
    });

    await vi.advanceTimersByTimeAsync(6_000);
    expect(refresh).toHaveBeenCalledOnce();
    first.resolve("pending");
    await vi.advanceTimersByTimeAsync(1_999);
    expect(refresh).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("subscribes only while pending and follows locale, visibility, and enabled changes", async () => {
    const subscription =
      ref<ContentTranslationSubscription>(defaultSubscription);
    const isPending = ref(false);
    const enabled = ref(true);
    const visibility = vi.spyOn(document, "visibilityState", "get");
    const { scope } = mountRecovery({
      subscription,
      identity: "opinion-1",
      enabled,
      isPending,
      classifyEvent: () => "refresh",
      refresh: () => Promise.resolve("pending"),
      onFailure: vi.fn(),
    });
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);

    isPending.value = true;
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([
      getContentTranslationTopic(subscription.value),
    ]);
    subscription.value = { ...defaultSubscription, targetLanguageCode: "fr" };
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([
      getContentTranslationTopic(subscription.value),
    ]);

    visibility.mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);
    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([
      getContentTranslationTopic(subscription.value),
    ]);

    enabled.value = false;
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);
    enabled.value = true;
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([
      getContentTranslationTopic(subscription.value),
    ]);
    scope.stop();
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);
  });

  it("keeps the same subscription across equivalent objects and source revision changes", async () => {
    const retain = vi.spyOn(contentTranslationSubscriptions, "retain");
    const subscription =
      ref<ContentTranslationSubscription>(defaultSubscription);
    const identity = ref("opinion-1:revision-1");
    mountRecovery({
      subscription,
      identity,
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh: () => Promise.resolve("pending"),
      onFailure: vi.fn(),
    });
    expect(retain).toHaveBeenCalledOnce();

    subscription.value = { ...defaultSubscription };
    await nextTick();
    expect(retain).toHaveBeenCalledOnce();
    identity.value = "opinion-1:revision-2";
    await nextTick();
    expect(retain).toHaveBeenCalledOnce();
    expect(contentTranslationSubscriptions.topics.value).toEqual([
      getContentTranslationTopic(defaultSubscription),
    ]);
  });

  it("coalesces repeated SSE events while refreshing", async () => {
    const first = Promise.withResolvers<ContentTranslationRefreshOutcome>();
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue("pending");
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
    });

    publishContentTranslationEvent(createEvent({ timestamp: 1 }));
    publishContentTranslationEvent(createEvent({ timestamp: 2 }));
    publishContentTranslationEvent(createEvent({ timestamp: 3 }));
    expect(refresh).toHaveBeenCalledOnce();
    first.resolve("pending");
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("ignores stale events and stops on a current terminal failure", async () => {
    const onFailure = vi.fn();
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: (data) => (data.status === "failed" ? "fail" : "refresh"),
      refresh: () => Promise.resolve("pending"),
      onFailure,
    });

    publishContentTranslationEvent(createEvent({ timestamp: 10 }));
    publishContentTranslationEvent(
      createEvent({ status: "failed", timestamp: 9 })
    );
    expect(onFailure).not.toHaveBeenCalled();
    publishContentTranslationEvent(
      createEvent({ status: "failed", timestamp: 11 })
    );
    expect(onFailure).toHaveBeenCalledOnce();
    await nextTick();
    expect(contentTranslationSubscriptions.topics.value).toEqual([]);
  });

  it.each([10, 9])(
    "refreshes parallel subjects even when their timestamp is %s",
    async (timestamp) => {
      const first = Promise.withResolvers<ContentTranslationRefreshOutcome>();
      const refresh = vi
        .fn<() => Promise<ContentTranslationRefreshOutcome>>()
        .mockReturnValueOnce(first.promise)
        .mockResolvedValue("pending");
      mountRecovery({
        identity: "item-list",
        enabled: true,
        isPending: true,
        classifyEvent: () => "refresh",
        refresh,
        onFailure: vi.fn(),
      });

      publishContentTranslationEvent(
        createEvent({ opinionSlugId: "first", timestamp: 10 })
      );
      publishContentTranslationEvent(
        createEvent({ opinionSlugId: "second", timestamp })
      );
      first.resolve("pending");
      await vi.advanceTimersByTimeAsync(0);
      expect(refresh).toHaveBeenCalledTimes(2);
    }
  );

  it("retains completion during an existing request and refreshes as soon as it finishes", async () => {
    const canRefresh = ref(false);
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockResolvedValue("settled");
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      canRefresh,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
    });

    publishContentTranslationEvent(createEvent());
    expect(refresh).not.toHaveBeenCalled();
    canRefresh.value = true;
    await nextTick();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("keeps deferred refreshes paused while the document is hidden", async () => {
    const canRefresh = ref(false);
    const visibility = vi.spyOn(document, "visibilityState", "get");
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockResolvedValue("settled");
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      canRefresh,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
    });

    publishContentTranslationEvent(createEvent());
    visibility.mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    canRefresh.value = true;
    await nextTick();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refresh).not.toHaveBeenCalled();

    visibility.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each(["stop", "identity", "disable", "settle", "dispose"] as const)(
    "discards deferred refreshes after %s",
    async (change) => {
      const canRefresh = ref(false);
      const identity = ref("opinion-1");
      const enabled = ref(true);
      const isPending = ref(true);
      const refresh = vi
        .fn<() => Promise<ContentTranslationRefreshOutcome>>()
        .mockResolvedValue("settled");
      const { recovery, scope } = mountRecovery({
        identity,
        enabled,
        isPending,
        canRefresh,
        classifyEvent: () => "refresh",
        refresh,
        onFailure: vi.fn(),
      });

      publishContentTranslationEvent(createEvent());
      switch (change) {
        case "stop":
          recovery.stop();
          break;
        case "identity":
          identity.value = "opinion-2";
          break;
        case "disable":
          enabled.value = false;
          break;
        case "settle":
          isPending.value = false;
          break;
        case "dispose":
          scope.stop();
          break;
      }
      canRefresh.value = true;
      await nextTick();
      expect(refresh).not.toHaveBeenCalled();
    }
  );

  it("restarts fast recovery when a completion event races with stale server data", async () => {
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockResolvedValue("pending");
    mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
    });

    await vi.advanceTimersByTimeAsync(12_000);
    expect(refresh).toHaveBeenCalledTimes(7);
    publishContentTranslationEvent(createEvent());
    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(8);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(refresh).toHaveBeenCalledTimes(9);
  });

  it("ignores an old in-flight failure after the request identity changes", async () => {
    const identity = ref("opinion-1");
    const first = Promise.withResolvers<ContentTranslationRefreshOutcome>();
    const onFailure = vi.fn();
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue("settled");
    mountRecovery({
      identity,
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh,
      onFailure,
    });

    publishContentTranslationEvent(createEvent());
    identity.value = "opinion-2";
    await nextTick();
    first.resolve("failed");
    await vi.advanceTimersByTimeAsync(2_000);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("unsubscribes and clears recovery on disposal", async () => {
    const unsubscribe = vi.fn();
    const refresh = vi
      .fn<() => Promise<ContentTranslationRefreshOutcome>>()
      .mockResolvedValue("pending");
    const { scope } = mountRecovery({
      identity: "opinion-1",
      enabled: true,
      isPending: true,
      classifyEvent: () => "refresh",
      refresh,
      onFailure: vi.fn(),
      subscribe: () => unsubscribe,
    });

    scope.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(refresh).not.toHaveBeenCalled();
  });
});
