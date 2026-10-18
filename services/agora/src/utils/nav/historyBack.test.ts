import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import {
  getHistoryPosition,
  isBackToConversationCommentTab,
  isHistoryBackToPath,
  isHistoryPathEqual,
  navigateBackOrReplace,
  navigateToHistoryPositionOrReplace,
  wasNavigationTriggeredByHistory,
} from "./historyBack";

describe("isBackToConversationCommentTab", () => {
  const prefix = "/conversation/abc123";

  it("returns true when back is the comment tab with trailing slash", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123/",
        conversationPathPrefix: prefix,
      })
    ).toBe(true);
  });

  it("returns true when back is the exact prefix (no trailing slash)", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123",
        conversationPathPrefix: prefix,
      })
    ).toBe(true);
  });

  it("returns true when back has a query string (no analysis)", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123/?opinion=xyz",
        conversationPathPrefix: prefix,
      })
    ).toBe(true);
  });

  it("returns false when back is the analysis tab", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123/analysis",
        conversationPathPrefix: prefix,
      })
    ).toBe(false);
  });

  it("returns false when back is the analysis tab with query", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123/analysis?tab=Me",
        conversationPathPrefix: prefix,
      })
    ).toBe(false);
  });

  it("returns false when back is a different conversation", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/other456/",
        conversationPathPrefix: prefix,
      })
    ).toBe(false);
  });

  it("returns false when back is null", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: null,
        conversationPathPrefix: prefix,
      })
    ).toBe(false);
  });

  it("returns false when back is undefined", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: undefined,
        conversationPathPrefix: prefix,
      })
    ).toBe(false);
  });

  it("returns false when back is a number", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: 42,
        conversationPathPrefix: prefix,
      })
    ).toBe(false);
  });

  it("works with embed route prefix", () => {
    const embedPrefix = "/conversation/abc123/embed";
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123/embed/",
        conversationPathPrefix: embedPrefix,
      })
    ).toBe(true);
  });

  it("returns false for embed analysis tab", () => {
    const embedPrefix = "/conversation/abc123/embed";
    expect(
      isBackToConversationCommentTab({
        historyBack: "/conversation/abc123/embed/analysis",
        conversationPathPrefix: embedPrefix,
      })
    ).toBe(false);
  });

  it("supports hash-history comment routes", () => {
    expect(
      isBackToConversationCommentTab({
        historyBack: "/#/conversation/abc123/?opinion=xyz",
        conversationPathPrefix: prefix,
      })
    ).toBe(true);
  });
});

describe("isHistoryBackToPath", () => {
  it("returns true when history back matches the expected path", () => {
    expect(
      isHistoryBackToPath({
        historyBack: "/conversation/new/create/",
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(true);
  });

  it("returns false when history back does not match the expected path", () => {
    expect(
      isHistoryBackToPath({
        historyBack: "/conversation/new/seed/",
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(false);
  });

  it("treats a missing trailing slash as the same path", () => {
    expect(
      isHistoryBackToPath({
        historyBack: "/conversation/new/create",
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(true);
  });

  it("ignores query strings when comparing history back paths", () => {
    expect(
      isHistoryBackToPath({
        historyBack: "/conversation/new/create/?draft=true",
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(true);
  });

  it("supports hash-history paths when comparing back targets", () => {
    expect(
      isHistoryBackToPath({
        historyBack: "/#/conversation/new/create/?draft=true",
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(true);
  });
});

describe("isHistoryPathEqual", () => {
  it("returns true when the normalized paths match", () => {
    expect(
      isHistoryPathEqual({
        historyPath: "/conversation/new/create/?draft=true",
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(true);
  });

  it("returns false for non-string history paths", () => {
    expect(
      isHistoryPathEqual({
        historyPath: null,
        expectedPath: "/conversation/new/create/",
      })
    ).toBe(false);
  });
});

describe("getHistoryPosition", () => {
  it("returns the numeric history position when present", () => {
    expect(
      getHistoryPosition({
        historyState: { position: 7 },
      })
    ).toBe(7);
  });

  it("returns null when the history state has no numeric position", () => {
    expect(
      getHistoryPosition({
        historyState: { position: "7" },
      })
    ).toBeNull();
  });
});

describe("wasNavigationTriggeredByHistory", () => {
  it("returns true when history forward points to the current route", () => {
    expect(
      wasNavigationTriggeredByHistory({
        currentPath: "/conversation/new/create/",
        historyBack: "/",
        historyForward: "/conversation/new/create/",
      })
    ).toBe(true);
  });

  it("returns true when history back points to the current route", () => {
    expect(
      wasNavigationTriggeredByHistory({
        currentPath: "/conversation/new/create/",
        historyBack: "/conversation/new/create/",
        historyForward: "/conversation/new/seed/",
      })
    ).toBe(true);
  });

  it("returns false when neither history direction points to the current route", () => {
    expect(
      wasNavigationTriggeredByHistory({
        currentPath: "/conversation/new/create/",
        historyBack: "/",
        historyForward: "/conversation/new/seed/",
      })
    ).toBe(false);
  });
});

describe("navigateBackOrReplace", () => {
  it("uses router.back when the previous history entry is valid", async () => {
    const router = {
      back: vi.fn(),
      replace: vi.fn(),
    };

    await navigateBackOrReplace({
      router,
      fallbackRoute: "/conversation/new/create/",
      shouldNavigateBack: true,
    });

    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("uses router.replace when the previous history entry is not valid", async () => {
    const router = {
      back: vi.fn(),
      replace: vi.fn().mockResolvedValue(undefined),
    };
    const fallbackRoute = "/conversation/new/create/";

    await navigateBackOrReplace({
      router,
      fallbackRoute,
      shouldNavigateBack: false,
    });

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(fallbackRoute);
  });
});

describe("navigateToHistoryPositionOrReplace", () => {
  it("reports a blocked navigation instead of a successful exit", async () => {
    const component = { render: () => null };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component },
        { path: "/blocked", component },
      ],
    });
    await router.push("/");
    router.beforeEach(() => false);
    const didExit = await navigateToHistoryPositionOrReplace({
      router,
      fallbackRoute: "/blocked",
      targetHistoryPosition: null,
      currentHistoryPosition: null,
    });
    expect(didExit).toBe(false);
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("uses router.go when the target history entry is earlier in the stack", async () => {
    const component = { render: () => null };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ["/", "/one", "/two", "/three"].map((path) => ({
        path,
        component,
      })),
    });
    for (const path of ["/", "/one", "/two", "/three"]) await router.push(path);
    const go = vi.spyOn(router, "go");
    const replace = vi.spyOn(router, "replace");

    const didExit = await navigateToHistoryPositionOrReplace({
      router,
      fallbackRoute: "/conversation/abc123/",
      targetHistoryPosition: 4,
      currentHistoryPosition: 7,
    });

    expect(go).toHaveBeenCalledWith(-3);
    expect(replace).not.toHaveBeenCalled();
    expect(didExit).toBe(true);
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("uses router.replace when there is no earlier history entry to restore", async () => {
    const router = {
      go: vi.fn(),
      replace: vi.fn().mockResolvedValue(undefined),
      afterEach: vi.fn(),
    };
    const fallbackRoute = "/conversation/abc123/";

    await navigateToHistoryPositionOrReplace({
      router,
      fallbackRoute,
      targetHistoryPosition: null,
      currentHistoryPosition: 7,
    });

    expect(router.go).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(fallbackRoute);
  });
});
