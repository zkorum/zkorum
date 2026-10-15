import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import type {
  SupportedDisplayLanguageCodes,
  SupportedSpokenLanguageCodes,
} from "src/shared/languages";
import type {
  FetchFeedHeadResponse,
  FetchFeedRequest,
  FetchFeedResponse,
} from "src/shared/types/dto";
import { useAuthenticationStore } from "src/stores/authentication";
import { useHomeFeedStore } from "src/stores/homeFeed";
import { useLanguageStore } from "src/stores/language";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick } from "vue";

const mocks = vi.hoisted(() => ({
  fetch:
    vi.fn<
      (params: {
        request: FetchFeedRequest;
        signal: AbortSignal;
        loadPersonalizedData: boolean;
      }) => Promise<FetchFeedResponse>
    >(),
  head: vi.fn<
    (params: {
      sortAlgorithm: "new" | "following";
      loadPersonalizedData: boolean;
      signal: AbortSignal;
    }) => Promise<FetchFeedHeadResponse>
  >(),
}));
vi.mock("./post", () => ({
  useBackendPostApi: () => ({
    fetchFeedPage: mocks.fetch,
    fetchFeedHead: mocks.head,
  }),
}));
vi.mock("src/stores/language", async () => {
  const { defineStore } = await import("pinia");
  const { ref } = await import("vue");
  return {
    useLanguageStore: defineStore("language", () => {
      const displayLanguage = ref<SupportedDisplayLanguageCodes>("en");
      const spokenLanguages = ref<SupportedSpokenLanguageCodes[]>(["en"]);
      return {
        displayLanguage,
        spokenLanguages,
        updateSpokenLanguages({
          newLanguages,
        }: {
          newLanguages: SupportedSpokenLanguageCodes[];
        }) {
          spokenLanguages.value = newLanguages;
          return Promise.resolve(true);
        },
        changeDisplayLanguage({
          newLanguage,
        }: {
          newLanguage: SupportedDisplayLanguageCodes;
        }) {
          displayLanguage.value = newLanguage;
          return Promise.resolve(true);
        },
      };
    }),
  };
});

import { parseFeedPage } from "./feedPageBoundary";
import { useFeedQuery } from "./useFeedQuery";

const createdAt = new Date("2026-01-01T00:00:00Z");
const cleanups: Array<() => void> = [];
beforeEach(() => {
  mocks.fetch.mockImplementation(({ request }) =>
    Promise.resolve(
      request.sortAlgorithm === "new"
        ? {
            sortAlgorithm: "new",
            feedItemList: [],
            nextCursor:
              request.cursor === null
                ? { conversationId: 20, createdAt }
                : null,
          }
        : {
            sortAlgorithm: "following",
            feedItemList: [],
            nextCursor:
              request.cursor === null
                ? {
                    conversationId: 20,
                    createdAt,
                    score: 1,
                    rankedAt: createdAt,
                  }
                : null,
          }
    )
  );
  mocks.head.mockResolvedValue({ topConversationSlugIdList: ["new00001"] });
});
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  vi.resetAllMocks();
});

function mountFeed() {
  const queryClient = new QueryClient();
  const state: { query?: ReturnType<typeof useFeedQuery> } = {};
  const app = createApp({
    setup() {
      state.query = useFeedQuery();
      return () => h("div");
    },
  });
  app.use(createPinia());
  app.use(VueQueryPlugin, { queryClient });
  app.mount(document.createElement("div"));
  cleanups.push(() => {
    app.unmount();
    queryClient.clear();
  });
  if (state.query === undefined) throw new Error("Missing mounted feed query");
  return {
    query: state.query,
    feed: useHomeFeedStore(),
    auth: useAuthenticationStore(),
    language: useLanguageStore(),
  };
}

describe("paged feed requests and cache", () => {
  it("does not restart a refresh under a different viewer after cancellation", async () => {
    const { query, auth } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    const refresh = query.refreshFeed();
    auth.setLoginStatus({
      isKnown: true,
      userId: "new-viewer",
      isRegistered: false,
    });
    await refresh;
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch.mock.calls[1]?.[0].loadPersonalizedData).toBe(true);
  });

  it("does not acknowledge a new viewer's update when an old refresh completes late", async () => {
    const { query, feed, auth } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    let complete: ((page: FetchFeedResponse) => void) | undefined;
    mocks.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    const refresh = query.refreshFeed();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));
    auth.setLoginStatus({
      isKnown: true,
      userId: "new-viewer",
      isRegistered: false,
    });
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(3));
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await feed.hasNewPostCheck("following");
    expect(feed.hasPendingFollowingTab).toBe(true);
    complete?.({
      sortAlgorithm: "following",
      feedItemList: [],
      nextCursor: null,
    });
    await refresh;
    await nextTick();
    expect(feed.hasPendingFollowingTab).toBe(true);
  });

  it("isolates language caches while normalizing spoken-language order", async () => {
    const { query, language } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await language.updateSpokenLanguages({ newLanguages: ["en", "fr"] });
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2));
    await language.updateSpokenLanguages({ newLanguages: ["fr", "en"] });
    await nextTick();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    await language.changeDisplayLanguage({ newLanguage: "fr" });
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(3));
  });
  it("keeps pending updates when restoring a cached tab", async () => {
    const { query, feed } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await feed.hasNewPostCheck("following");
    expect(feed.hasPendingFollowingTab).toBe(true);
    feed.currentHomeFeedTab = "new";
    await vi.waitFor(() =>
      expect(query.data.value?.pages[0]?.sortAlgorithm).toBe("new")
    );
    feed.currentHomeFeedTab = "following";
    await nextTick();
    expect(feed.hasPendingFollowingTab).toBe(true);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it("acknowledges updates only after a successful fresh first-page read", async () => {
    const { query, feed } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await feed.hasNewPostCheck("following");
    expect(feed.hasPendingFollowingTab).toBe(true);
    mocks.fetch.mockRejectedValueOnce(new Error("Temporary failure"));
    await query.refreshFeed();
    expect(feed.hasPendingFollowingTab).toBe(true);
    await query.refreshFeed();
    expect(feed.hasPendingFollowingTab).toBe(false);
  });

  it("coalesces concurrent refreshes into one first-page request", async () => {
    const { query } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await query.fetchNextPage();
    mocks.fetch.mockClear();
    await Promise.all([
      query.refreshFeed(),
      query.refreshFeed(),
      query.refreshFeed(),
    ]);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(query.data.value?.pages).toHaveLength(1);
  });

  it("retries a failed next page without discarding or re-fetching the first page", async () => {
    const { query } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    const firstPage = query.data.value?.pages[0];
    mocks.fetch.mockRejectedValueOnce(new Error("Temporary failure"));
    await query.fetchNextPage();
    expect(query.isFetchNextPageError.value).toBe(true);
    expect(query.data.value?.pages).toHaveLength(1);
    await query.fetchNextPage({ cancelRefetch: false });
    expect(query.data.value?.pages[0]).toEqual(firstPage);
    expect(query.data.value?.pages).toHaveLength(2);
    expect(mocks.fetch.mock.calls[1]?.[0].request).toEqual(
      mocks.fetch.mock.calls[2]?.[0].request
    );
  });
  it("loads one page initially and only fetches the next cursor on demand", async () => {
    const { query } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0]?.[0].request).toEqual({
      sortAlgorithm: "following",
      cursor: null,
    });
    await query.fetchNextPage({ cancelRefetch: false });
    await vi.waitFor(() => expect(query.data.value?.pages).toHaveLength(2));
    expect(mocks.fetch.mock.calls[1]?.[0].request).toMatchObject({
      sortAlgorithm: "following",
      cursor: { conversationId: 20, score: 1 },
    });
    expect(query.hasNextPage.value).toBe(false);
    await query.fetchNextPage();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it("refreshes just the first page after loading several pages", async () => {
    const { query } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await query.fetchNextPage();
    await vi.waitFor(() => expect(query.data.value?.pages).toHaveLength(2));
    mocks.fetch.mockClear();
    await query.refreshFeed();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0]?.[0].request.cursor).toBeNull();
    expect(query.data.value?.pages).toHaveLength(1);
  });

  it("restores each tab's pages without another feed request", async () => {
    const { query, feed } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    await query.fetchNextPage();
    feed.currentHomeFeedTab = "new";
    await vi.waitFor(() =>
      expect(query.data.value?.pages[0]?.sortAlgorithm).toBe("new")
    );
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    feed.currentHomeFeedTab = "following";
    await nextTick();
    expect(query.data.value?.pages).toHaveLength(2);
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
  });

  it("cancels obsolete requests and does not display another viewer's response", async () => {
    let completeAnonymous: ((page: FetchFeedResponse) => void) | undefined;
    mocks.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeAnonymous = resolve;
        })
    );
    const { query, auth } = mountFeed();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    const oldSignal = mocks.fetch.mock.calls[0]?.[0].signal;
    auth.setLoginStatus({
      isKnown: true,
      userId: "viewer",
      isRegistered: false,
    });
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    expect(oldSignal?.aborted).toBe(true);
    expect(mocks.fetch.mock.calls[1]?.[0].loadPersonalizedData).toBe(true);
    completeAnonymous?.({
      sortAlgorithm: "following",
      feedItemList: [],
      nextCursor: null,
    });
    await nextTick();
    expect(query.hasNextPage.value).toBe(true);
  });

  it("rejects a response whose cursor variant does not match the requested tab", () => {
    expect(() =>
      parseFeedPage({
        request: { sortAlgorithm: "new", cursor: null },
        rawResponse: {
          sortAlgorithm: "following",
          feedItemList: [],
          nextCursor: null,
        },
      })
    ).toThrow();
  });
});

describe("lightweight feed update checks", () => {
  it("uses the public SSE head directly for public viewers", async () => {
    const { query, feed } = mountFeed();
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    feed.onPopularConversationUpdate(["new00001"]);
    expect(feed.hasPendingFollowingTab).toBe(true);
    expect(mocks.head).not.toHaveBeenCalled();
    feed.onPopularConversationUpdate([]);
    expect(feed.hasPendingFollowingTab).toBe(false);
  });

  it("checks personalized heads before accepting a public SSE hint", async () => {
    const { query, feed, auth } = mountFeed();
    auth.setLoginStatus({
      isKnown: true,
      userId: "viewer",
      isRegistered: false,
    });
    await vi.waitFor(() => expect(query.isSuccess.value).toBe(true));
    mocks.head.mockResolvedValueOnce({ topConversationSlugIdList: [] });
    feed.onPopularConversationUpdate(["muted001"]);
    await vi.waitFor(() => expect(mocks.head).toHaveBeenCalledTimes(1));
    expect(feed.hasPendingFollowingTab).toBe(false);
  });
  it("detects the first conversation after an empty feed without checking unloaded tabs", async () => {
    const { feed } = mountFeed();
    await feed.hasNewPostCheck("new");
    expect(mocks.head).not.toHaveBeenCalled();
    feed.confirmFeedHead({ tab: "new", slugIds: [] });
    await feed.hasNewPostCheck("new");
    expect(mocks.head).toHaveBeenCalledTimes(1);
    expect(feed.hasPendingNewTab).toBe(true);
  });
  it("coalesces concurrent checks and keeps the update pill until the feed refreshes", async () => {
    const { feed } = mountFeed();
    feed.confirmFeedHead({ tab: "new", slugIds: ["old00001"] });
    await Promise.all([
      feed.hasNewPostCheck("new"),
      feed.hasNewPostCheck("new"),
      feed.hasNewPostCheck("new"),
    ]);
    expect(mocks.head).toHaveBeenCalledTimes(1);
    expect(feed.hasPendingNewTab).toBe(true);
    await feed.hasNewPostCheck("new");
    expect(feed.hasPendingNewTab).toBe(true);
    feed.confirmFeedHead({ tab: "new", slugIds: ["new00001"] });
    expect(feed.hasPendingNewTab).toBe(false);
  });

  it("ignores a pending check after the viewer changes", async () => {
    const { feed, auth } = mountFeed();
    let complete: ((head: FetchFeedHeadResponse) => void) | undefined;
    mocks.head.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    feed.confirmFeedHead({ tab: "new", slugIds: ["old00001"] });
    const check = feed.hasNewPostCheck("new");
    auth.setLoginStatus({
      isKnown: true,
      userId: "new-viewer",
      isRegistered: false,
    });
    expect(mocks.head.mock.calls[0]?.[0].signal.aborted).toBe(true);
    complete?.({ topConversationSlugIdList: ["new00001"] });
    await check;
    expect(feed.hasPendingNewTab).toBe(false);
  });

  it("ignores an obsolete check after a newer first page has arrived", async () => {
    const { feed } = mountFeed();
    let complete: ((head: FetchFeedHeadResponse) => void) | undefined;
    mocks.head.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
    feed.confirmFeedHead({ tab: "new", slugIds: ["old00001"] });
    const check = feed.hasNewPostCheck("new");
    feed.confirmFeedHead({ tab: "new", slugIds: ["latest01"] });
    expect(mocks.head.mock.calls[0]?.[0].signal.aborted).toBe(true);
    complete?.({ topConversationSlugIdList: ["new00001"] });
    await check;
    expect(feed.hasPendingNewTab).toBe(false);
  });
});
