import { QueryClient } from "@tanstack/vue-query";
import type { ConversationProjectAssignment } from "src/shared/types/zod";
import { zodConversationProjectContext } from "src/shared/types/zod";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const stores = vi.hoisted(() => ({ feed: vi.fn(), profile: vi.fn() }));
vi.mock("src/stores/homeFeed", () => ({
  useHomeFeedStore: () => ({ applyProjectAssignment: stores.feed }),
}));
vi.mock("src/stores/user", () => ({
  useUserStore: () => ({ applyProjectAssignment: stores.profile }),
}));
vi.mock("./post", () => ({ useBackendPostApi: vi.fn() }));

import { applyConversationProjectAssignment } from "./conversationProjectCache";

const cachedMetadata = z.object({
  projectContext: zodConversationProjectContext.optional(),
});
const cachedLegacy = z.object({ metadata: cachedMetadata });
const cachedDetail = z.object({
  conversationData: z.object({ metadata: cachedMetadata }),
});

describe("conversation project cache updates", () => {
  it("keeps the committed scope after an immediate stale replica refresh", async () => {
    const queryClient = new QueryClient();
    const key = ["conversation", "conv1234"];
    const oldMetadata = {
      projectContext: {
        projectSlug: "source",
        originalProjectTitle: "Source",
        conversationSlugId: "conv1234",
      },
    };
    queryClient.setQueryData(key, { metadata: oldMetadata });
    vi.spyOn(queryClient, "invalidateQueries").mockImplementation((filters) => {
      const resolvedFilters =
        typeof filters === "function" ? filters() : filters;
      if (resolvedFilters?.queryKey?.[0] === "conversation")
        queryClient.setQueryData(key, { metadata: oldMetadata });
      return Promise.resolve();
    });
    await applyConversationProjectAssignment({
      queryClient,
      conversationSlugId: "conv1234",
      assignment: {
        previousProjectSlug: "source",
        projectSlug: "destination",
        projectTitle: "Destination",
        target: { kind: "project", projectSlug: "destination" },
      },
      refreshConversation: true,
    });
    expect(
      cachedLegacy.parse(queryClient.getQueryData(key)).metadata.projectContext
        ?.projectSlug
    ).toBe("destination");
    queryClient.clear();
  });

  it("does not apply a superseded SSE assignment after its refresh completes", async () => {
    const queryClient = new QueryClient();
    const key = ["conversation", "conv1234"];
    const latestMetadata = {
      projectContext: {
        projectSlug: "latest",
        originalProjectTitle: "Latest",
        conversationSlugId: "conv1234",
      },
    };
    queryClient.setQueryData(key, { metadata: latestMetadata });
    await applyConversationProjectAssignment({
      queryClient,
      conversationSlugId: "conv1234",
      assignment: {
        previousProjectSlug: "source",
        projectSlug: "destination",
        projectTitle: "Destination",
        target: { kind: "project", projectSlug: "destination" },
      },
      isCurrent: () => false,
    });
    expect(
      cachedLegacy.parse(queryClient.getQueryData(key)).metadata.projectContext
        ?.projectSlug
    ).toBe("latest");
    queryClient.clear();
  });
  it("updates all cached representations and invalidates both project scopes", async () => {
    const queryClient = new QueryClient();
    const originalContext = {
      projectSlug: "source",
      originalProjectTitle: "Source",
      conversationSlugId: "conv1234",
    };
    queryClient.setQueryData(["conversation", "conv1234", "legacy"], {
      metadata: { projectContext: originalContext },
    });
    queryClient.setQueryData(["conversation", "conv1234", "detail"], {
      conversationData: { metadata: { projectContext: originalContext } },
      displayContent: {},
    });
    queryClient.setQueryData(["projectPage", "source"], {});
    queryClient.setQueryData(["projectPage", "destination"], {});
    queryClient.setQueryData(["projectPage", "unrelated"], {});
    const assignment = {
      previousProjectSlug: "source",
      projectSlug: "destination",
      projectTitle: "Destination",
      target: { kind: "project", projectSlug: "destination" },
    } satisfies ConversationProjectAssignment;
    await applyConversationProjectAssignment({
      queryClient,
      conversationSlugId: "conv1234",
      assignment,
    });
    expect(
      cachedLegacy.parse(
        queryClient.getQueryData(["conversation", "conv1234", "legacy"])
      ).metadata.projectContext?.projectSlug
    ).toBe("destination");
    expect(
      cachedDetail.parse(
        queryClient.getQueryData(["conversation", "conv1234", "detail"])
      ).conversationData.metadata.projectContext?.originalProjectTitle
    ).toBe("Destination");
    expect(
      queryClient.getQueryState(["projectPage", "source"])?.isInvalidated
    ).toBe(true);
    expect(
      queryClient.getQueryState(["projectPage", "destination"])?.isInvalidated
    ).toBe(true);
    expect(
      queryClient.getQueryState(["projectPage", "unrelated"])?.isInvalidated
    ).toBe(false);
    expect(stores.feed).toHaveBeenCalledWith({
      conversationSlugId: "conv1234",
      assignment,
    });
    expect(stores.profile).toHaveBeenCalledWith({
      conversationSlugId: "conv1234",
      assignment,
    });
    queryClient.clear();
  });

  it("removes stale listed-project context when moving into No Project", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["conversation", "conv1234"], {
      metadata: {
        projectContext: {
          projectSlug: "source",
          originalProjectTitle: "Source",
          conversationSlugId: "conv1234",
        },
      },
    });
    await applyConversationProjectAssignment({
      queryClient,
      conversationSlugId: "conv1234",
      assignment: {
        previousProjectSlug: "source",
        projectSlug: "org-default",
        projectTitle: "Owner",
        target: { kind: "no_project", organizationSlug: "owner" },
      },
    });
    expect(
      cachedLegacy.parse(queryClient.getQueryData(["conversation", "conv1234"]))
        .metadata.projectContext
    ).toBeUndefined();
    queryClient.clear();
  });
});
