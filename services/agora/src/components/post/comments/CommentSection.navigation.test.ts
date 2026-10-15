import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia, defineStore } from "pinia";
import type {
  GetOpinionBySlugIdListResponse,
  OpinionTarget,
} from "src/shared/types/dto";
import type {
  DisplayedOpinionItem,
  ExtendedConversationDisplayData,
} from "src/shared/types/zod";
import { useAuthenticationStore } from "src/stores/authentication";
import { useLanguageStore } from "src/stores/language";
import type { useBackendCommentApi } from "src/utils/api/comment/comment";
import { getOpinionTargetQueryKey } from "src/utils/api/comment/opinionTargetQueryKey";
import type { CommentFilterOptions } from "src/utils/component/opinion";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  computed,
  createApp,
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  ref,
} from "vue";
import { createMemoryHistory, createRouter } from "vue-router";

const mocks = vi.hoisted(() => ({
  fetchTargets:
    vi.fn<
      ReturnType<typeof useBackendCommentApi>["fetchOpinionsBySlugIdList"]
    >(),
  fetchPage:
    vi.fn<ReturnType<typeof useBackendCommentApi>["fetchOpinionPage"]>(),
  notify: vi.fn(),
}));

vi.mock("src/stores/user", () => ({
  useUserStore: defineStore("test-user", {
    state: () => ({
      profileData: {
        userName: "different-from-statement-author",
        isSiteModerator: false,
      },
    }),
  }),
}));
vi.mock("src/stores/authentication", () => ({
  useAuthenticationStore: defineStore("test-auth", {
    state: (): { userId: string | undefined } => ({ userId: "viewer" }),
    actions: {
      setLoginStatus(status: { userId?: string }) {
        this.userId = status.userId;
      },
    },
  }),
}));
vi.mock("src/stores/language", () => ({
  useLanguageStore: defineStore("test-language", {
    state: () => ({ displayLanguage: "en", spokenLanguages: ["en"] }),
    actions: {
      changeDisplayLanguage({ newLanguage }: { newLanguage: string }) {
        this.displayLanguage = newLanguage;
        return Promise.resolve(true);
      },
    },
  }),
}));
vi.mock("src/utils/api/auth", () => ({
  useBackendAuthApi: () => ({ loadAuthenticatedModules: vi.fn() }),
}));
vi.mock("src/utils/api/comment/comment", () => ({
  useBackendCommentApi: () => ({
    fetchOpinionsBySlugIdList: mocks.fetchTargets,
    fetchOpinionPage: mocks.fetchPage,
  }),
}));
vi.mock("src/utils/api/comment/useCommentQueries", () => ({
  useInvalidateCommentQueries: () => ({
    invalidateAll: vi.fn(),
    markCommentsAsStale: vi.fn(),
  }),
}));
vi.mock("src/composables/opinion/useOpinionVoting", () => ({
  useOpinionVoting: () => ({
    userVotes: computed(() => []),
    castVote: vi.fn(),
    fetchUserVotingData: vi.fn(),
  }),
}));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: mocks.notify }),
}));
vi.mock("src/components/ui/AsyncStateHandler.vue", () => ({
  default: defineComponent(
    (_, { slots }) =>
      () =>
        h("div", slots.default?.())
  ),
}));
vi.mock("src/components/feed/NewContentPill.vue", () => ({
  default: defineComponent(() => () => null),
}));
vi.mock("./OneAtATimeSection.vue", () => ({
  default: defineComponent(
    () => () => h("div", { "data-testid": "one-at-a-time" })
  ),
}));
vi.mock("./group/CommentGroup.vue", () => ({
  default: defineComponent(
    (props: { highlightedOpinion: DisplayedOpinionItem | null }) => () =>
      h(
        "div",
        { "data-testid": "highlight" },
        props.highlightedOpinion?.opinionSlugId
      ),
    { props: { highlightedOpinion: { type: [Object, null], required: true } } }
  ),
}));

import ConversationCommentTab from "../ConversationCommentTab.vue";

function target({
  slugId = "statement",
  isOwn = true,
  conversationSlugId = "conversa",
}: {
  slugId?: string;
  isOwn?: boolean;
  conversationSlugId?: string;
} = {}): OpinionTarget {
  return {
    conversationSlugId,
    isOwn,
    opinion: {
      opinionSlugId: slugId,
      opinion: "My statement",
      sourceLanguageCode: "en",
      username: "author",
      createdAt: new Date(),
      updatedAt: new Date(),
      numParticipants: 0,
      numAgrees: 0,
      numDisagrees: 0,
      numPasses: 0,
      moderation: { status: "unmoderated" },
      isSeed: false,
      displayContent: {
        sourceVersion: "source",
        status: "available",
        mode: "original",
        content: { content: "My statement" },
        translationControl: null,
      },
    },
  };
}

function conversation(
  votingPresentation: "list" | "one_at_a_time"
): ExtendedConversationDisplayData {
  return {
    metadata: {
      conversationSlugId: "conversa",
      conversationType: "polis",
      votingPresentation,
      createdAt: new Date(),
      lastReactedAt: new Date(),
      opinionCount: 1,
      voteCount: 0,
      participantCount: 0,
      totalOpinionCount: 1,
      totalVoteCount: 0,
      totalParticipantCount: 0,
      moderatedOpinionCount: 0,
      hiddenOpinionCount: 0,
      authorUsername: "facilitator",
      participationMode: "guest",
      isIndexed: true,
      aiLabelingEnabled: false,
      preferredOpinionGroupCount: null,
      contentLanguageMetadata: {
        detectedDisplayLanguageCode: "en",
        detectedSourceLanguageCode: "en",
        detectedRawLanguageCode: "en",
        detectionConfidence: 1,
        autoDetectionStatus: "detected",
      },
      languageSetting: {
        mode: "manual",
        languageCode: "en",
        detectedLanguageCode: "en",
        detectedSourceLanguageCode: "en",
        detectedRawLanguageCode: "en",
        detectionConfidence: 1,
        autoDetectionStatus: "detected",
      },
      multilingualSetting: {
        additionalLanguageCodes: [],
        dynamicTranslationEnabled: false,
      },
      isClosed: false,
      isEdited: false,
      moderation: { status: "unmoderated" },
      externalSourceConfig: null,
    },
    interaction: {
      hasVoted: false,
      votedIndex: 0,
      conversationCapabilities: {
        canEdit: false,
        canDelete: false,
        canManageIntegrations: false,
      },
    },
  };
}

let app: ReturnType<typeof createApp> | undefined;
let queryClient: QueryClient | undefined;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchTargets.mockResolvedValue([target()]);
  mocks.fetchPage.mockResolvedValue({
    items: [],
    nextCursor: null,
    nextRequest: undefined,
  });
});
afterEach(() => {
  app?.unmount();
  queryClient?.clear();
  document.body.replaceChildren();
});

async function mountStatementLink({
  presentation = "one_at_a_time",
  url = "/conversation/conversa/?opinion=statement",
  loaded = true,
}: {
  presentation?: "list" | "one_at_a_time";
  url?: string;
  loaded?: boolean;
} = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/conversation/:postSlugId/",
        component: { template: "<div />" },
      },
      {
        path: "/project/:projectSlug/conversation/:postSlugId/",
        component: { template: "<div />" },
      },
    ],
  });
  await router.push(url);
  const conversationData = ref<ExtendedConversationDisplayData | undefined>(
    loaded ? conversation(presentation) : undefined
  );
  const visible = ref(true);
  const filter = ref<CommentFilterOptions>("discover");
  const editingOpinion = ref<DisplayedOpinionItem>();
  const root = defineComponent(
    () => () =>
      h(KeepAlive, null, () =>
        visible.value
          ? h(ConversationCommentTab, {
              conversationData: conversationData.value,
              moderationHistoryTrigger: 0,
              commentFilter: filter.value,
              editingOpinion: editingOpinion.value,
              onViewAnalysis: vi.fn(),
              conversationRouteContext: { kind: "normal" },
              "onUpdate:commentFilter": (value: CommentFilterOptions) => {
                filter.value = value;
              },
            })
          : null
      )
  );
  const container = document.createElement("div");
  document.body.append(container);
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  app = createApp(root);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  app.use(VueQueryPlugin, { queryClient });
  app.component(
    "QInfiniteScroll",
    defineComponent(
      (_, { slots }) =>
        () =>
          h("div", slots.default?.())
    )
  );
  app.mount(container);
  await nextTick();
  return {
    router,
    conversationData,
    filter,
    editingOpinion,
    visible,
    container,
    auth: useAuthenticationStore(pinia),
    language: useLanguageStore(pinia),
  };
}

function highlighted(container: HTMLElement): string | undefined {
  return (
    container.querySelector('[data-testid="highlight"]')?.textContent ??
    undefined
  );
}

describe("statement URL navigation", () => {
  it("uses backend ownership and opens the own statement in My statements without fetching Discover", async () => {
    const { filter, container, router } = await mountStatementLink();
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    expect(highlighted(container)).toBe("statement");
    expect(mocks.fetchTargets).toHaveBeenCalledTimes(1);
    expect(
      mocks.fetchPage.mock.calls.map(([request]) => request.filter)
    ).toEqual(["my_statements"]);
    expect(router.currentRoute.value.query.opinion).toBe("statement");
  });

  it("uses Discover for another author's statement", async () => {
    mocks.fetchTargets.mockResolvedValue([target({ isOwn: false })]);
    const { filter, container } = await mountStatementLink();
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    expect(filter.value).toBe("discover");
    expect(container.querySelector('[data-testid="one-at-a-time"]')).toBeNull();
  });

  it("supports manually entered project conversation links", async () => {
    const { filter, container } = await mountStatementLink({
      url: "/project/project/conversation/conversa/?opinion=statement",
    });
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    expect(highlighted(container)).toBe("statement");
  });

  it("rejects ambiguous repeated statement parameters before making a target request", async () => {
    const { container } = await mountStatementLink({
      url: "/conversation/conversa/?opinion=statement&opinion=second",
    });
    expect(mocks.fetchTargets).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-testid="one-at-a-time"]')
    ).not.toBeNull();
  });

  it("derives the filter from refreshed conversation data while retaining the highlight", async () => {
    const { conversationData, filter, container } = await mountStatementLink({
      presentation: "list",
    });
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    expect(filter.value).toBe("discover");
    for (const mode of ["one_at_a_time", "list"] satisfies Array<
      "list" | "one_at_a_time"
    >) {
      conversationData.value = conversation(mode);
      await vi.waitFor(() =>
        expect(filter.value).toBe(
          mode === "list" ? "discover" : "my_statements"
        )
      );
      expect(highlighted(container)).toBe("statement");
    }
  });

  it("restores the linked statement and its ownership context after cancelling an edit", async () => {
    const { filter, container, editingOpinion, conversationData } =
      await mountStatementLink();
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    editingOpinion.value = target({ slugId: "editing" }).opinion;
    await vi.waitFor(() => expect(highlighted(container)).toBe("editing"));
    editingOpinion.value = undefined;
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    conversationData.value = conversation("list");
    await vi.waitFor(() => expect(filter.value).toBe("discover"));
    conversationData.value = conversation("one_at_a_time");
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    expect(highlighted(container)).toBe("statement");
  });

  it("uses the loaded conversation's latest mode when the statement arrives later", async () => {
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    const { conversationData, filter, container } = await mountStatementLink({
      presentation: "one_at_a_time",
    });
    expect(mocks.fetchPage).not.toHaveBeenCalled();
    conversationData.value = conversation("list");
    response.resolve([target()]);
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    expect(filter.value).toBe("discover");
    expect(
      mocks.fetchPage.mock.calls.map(([request]) => request.filter)
    ).toEqual(["discover"]);
  });

  it("waits for the conversation before loading or selecting a statement view", async () => {
    const { conversationData, filter, container } = await mountStatementLink({
      loaded: false,
    });
    expect(mocks.fetchTargets).not.toHaveBeenCalled();
    expect(mocks.fetchPage).not.toHaveBeenCalled();
    conversationData.value = conversation("one_at_a_time");
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    expect(highlighted(container)).toBe("statement");
  });

  it("ignores an old response after navigating to a different statement and preserves URL context", async () => {
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    const { router, container } = await mountStatementLink();
    mocks.fetchTargets.mockResolvedValue([target({ slugId: "second" })]);
    await router.push(
      "/conversation/conversa/?opinion=second&context=keep#anchor"
    );
    await vi.waitFor(() => expect(highlighted(container)).toBe("second"));
    response.resolve([target()]);
    await nextTick();
    expect(highlighted(container)).toBe("second");
    expect(router.currentRoute.value.fullPath).toContain(
      "opinion=second&context=keep#anchor"
    );
  });

  it("clears the previous highlight for missing or cross-conversation statements", async () => {
    const { router, container } = await mountStatementLink();
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    mocks.fetchTargets.mockResolvedValue([
      target({ slugId: "missing", conversationSlugId: "another" }),
    ]);
    await router.push("/conversation/conversa/?opinion=missing");
    await vi.waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith("statementNotFound")
    );
    expect(highlighted(container)).toBe("");
  });

  it("does not restore a pending highlight after a manual filter selection", async () => {
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    const { router, filter, container } = await mountStatementLink();
    filter.value = "my_votes";
    await router.replace("/conversation/conversa/?filter=my_votes");
    response.resolve([target()]);
    await nextTick();
    expect(filter.value).toBe("my_votes");
    expect(highlighted(container)).toBe("");
  });

  it("can resume one-at-a-time Discover when selecting the already selected filter", async () => {
    mocks.fetchTargets.mockResolvedValue([target({ isOwn: false })]);
    const { router, filter, container } = await mountStatementLink();
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    expect(filter.value).toBe("discover");
    await router.replace("/conversation/conversa/?filter=discover");
    await vi.waitFor(() =>
      expect(
        container.querySelector('[data-testid="one-at-a-time"]')
      ).not.toBeNull()
    );
  });

  it("ignores responses for the previous authenticated viewer", async () => {
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    const { auth, container } = await mountStatementLink();
    const nextResponse =
      Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(nextResponse.promise);
    auth.setLoginStatus({ isKnown: true, userId: "another-viewer" });
    await nextTick();
    response.resolve([target()]);
    await nextTick();
    expect(highlighted(container)).toBe("");
    expect(
      queryClient?.getQueryData(
        getOpinionTargetQueryKey({
          opinionSlugId: "statement",
          viewerUserId: "viewer",
          displayLanguage: "en",
          spokenLanguages: ["en"],
        })
      )
    ).toBeUndefined();
    nextResponse.resolve([target({ isOwn: false })]);
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
  });

  it("waits for new ownership before fetching a list after the viewer changes", async () => {
    const { auth, filter } = await mountStatementLink();
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    mocks.fetchPage.mockClear();
    auth.setLoginStatus({ isKnown: false });
    await nextTick();
    expect(mocks.fetchPage).not.toHaveBeenCalled();
    response.resolve([target({ isOwn: false })]);
    await vi.waitFor(() => expect(filter.value).toBe("discover"));
    expect(
      mocks.fetchPage.mock.calls.map(([request]) => request.filter)
    ).toEqual(["discover"]);
  });

  it("ignores a response in the previous display language", async () => {
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    const { language, container } = await mountStatementLink();
    const nextResponse =
      Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(nextResponse.promise);
    await language.changeDisplayLanguage({ newLanguage: "fr" });
    response.resolve([target()]);
    await nextTick();
    expect(highlighted(container)).toBe("");
    expect(
      queryClient?.getQueryData(
        getOpinionTargetQueryKey({
          opinionSlugId: "statement",
          viewerUserId: "viewer",
          displayLanguage: "en",
          spokenLanguages: ["en"],
        })
      )
    ).toBeUndefined();
    nextResponse.resolve([target()]);
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
  });

  it("does not populate caches or notify after a pending page is unmounted", async () => {
    const response = Promise.withResolvers<GetOpinionBySlugIdListResponse>();
    mocks.fetchTargets.mockReturnValueOnce(response.promise);
    await mountStatementLink();
    app?.unmount();
    app = undefined;
    response.resolve([target()]);
    await nextTick();
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(
      queryClient?.getQueryData(
        getOpinionTargetQueryKey({
          opinionSlugId: "statement",
          viewerUserId: "viewer",
          displayLanguage: "en",
          spokenLanguages: ["en"],
        })
      )
    ).toBeUndefined();
  });

  it("reopens the statement when returning to a cached page", async () => {
    const { router, filter, visible, container } = await mountStatementLink();
    await vi.waitFor(() => expect(highlighted(container)).toBe("statement"));
    filter.value = "my_votes";
    await router.replace("/conversation/conversa/?filter=my_votes");
    visible.value = false;
    await nextTick();
    await router.push("/conversation/conversa/?opinion=statement");
    visible.value = true;
    await vi.waitFor(() => expect(filter.value).toBe("my_statements"));
    expect(highlighted(container)).toBe("statement");
  });
});
