import type { PolisClusters, PolisKey } from "src/shared/types/zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, reactive } from "vue";

vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("src/components/ui/VoteLegend.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("../common/AnalysisActionButton.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("../common/AnalysisTitleHeader.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("../common/AnalysisClusterSelectorBar.vue", () => ({
  default: {
    props: ["clusters"],
    emits: ["update:selectedClusterKey"],
    template: `
      <div>
        <button
          v-for="cluster in clusters"
          :key="cluster.key"
          :data-selector-group="cluster.key"
          @click="$emit('update:selectedClusterKey', cluster.key)"
        />
      </div>
    `,
  },
}));

vi.mock("./ClusterInformationDialog.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("./GroupConsensusSummary.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("./ClusterVisualization.vue", () => ({
  default: {
    props: ["clusters", "currentClusterTab"],
    emits: ["update:currentClusterTab"],
    template: `
      <div :data-selected-group="currentClusterTab">
        <button
          v-for="cluster in clusters"
          :key="cluster.key"
          :data-group="cluster.key"
          @click="$emit('update:currentClusterTab', cluster.key)"
        />
      </div>
    `,
  },
}));

vi.mock("./OpinionGroupComments.vue", () => ({
  default: {
    props: ["displayMode"],
    emits: ["nextDisplayMode"],
    methods: { getHeaderElement: () => null },
    template: `
      <button :data-display-mode="displayMode" @click="$emit('nextDisplayMode')" />
    `,
  },
}));

import OpinionGroupTab from "./OpinionGroupTab.vue";

const unmountCallbacks: Array<() => void> = [];

afterEach(() => {
  for (const unmount of unmountCallbacks.splice(0)) {
    unmount();
  }
  document.body.replaceChildren();
});

function createClusters({
  keys = ["0", "1", "2"],
  userClusterKey = "0",
}: {
  keys?: PolisKey[];
  userClusterKey?: PolisKey;
} = {}): PolisClusters {
  const clusters: PolisClusters = {};
  for (const key of keys) {
    clusters[key] = {
      key,
      numUsers: 10,
      isUserInCluster: key === userClusterKey,
      representative: [],
    };
  }
  return clusters;
}

function mountGroups(clusters = createClusters()) {
  const props = reactive({
    conversationSlugId: "conversation-one",
    conversationAuthorUsername: "author",
    conversationOrganizationName: "",
    clusters,
    totalParticipantCount: 40,
    aiLabelingEnabled: false,
    conversationScrollContext: {
      actionBarElement: null,
      scrollContainerElement: null,
      getScrollPosition: () => 0,
      getElementScrollPosition: () => 0,
      scrollToPosition: vi.fn(),
    },
  });
  const container = document.createElement("div");
  document.body.append(container);
  const app = createApp({ render: () => h(OpinionGroupTab, props) });
  app.component("QIcon", { template: "<span />" });
  app.mount(container);
  unmountCallbacks.push(() => app.unmount());

  async function clickButton(selector: string): Promise<void> {
    const button = container.querySelector(selector);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (button instanceof HTMLButtonElement) {
      button.click();
    }
    await nextTick();
  }

  return {
    props,
    selectedGroup: () =>
      container
        .querySelector("[data-selected-group]")
        ?.getAttribute("data-selected-group"),
    displayMode: () =>
      container
        .querySelector("[data-display-mode]")
        ?.getAttribute("data-display-mode"),
    selectGroup: (key: PolisKey) => clickButton(`[data-group="${key}"]`),
    selectGroupFromSelector: (key: PolisKey) =>
      clickButton(`[data-selector-group="${key}"]`),
    nextDisplayMode: () => clickButton("[data-display-mode]"),
  };
}

describe("opinion group selection continuity", () => {
  it("initially selects the user's group, including when analysis loads later", async () => {
    const groups = mountGroups({});

    groups.props.clusters = createClusters({ userClusterKey: "1" });
    await nextTick();

    expect(groups.selectedGroup()).toBe("1");
  });

  it("retains the selected group and statement view when membership changes at the same group count", async () => {
    const groups = mountGroups();
    await groups.selectGroup("2");
    await groups.nextDisplayMode();

    groups.props.clusters = createClusters({ userClusterKey: "1" });
    await nextTick();

    expect(groups.selectedGroup()).toBe("2");
    expect(groups.displayMode()).toBe("all_other_groups");
  });

  it.each<PolisKey[][]>([[["0", "1"]], [["0", "1", "2", "3"]]])(
    "returns to Me when the group count changes to %j, even if the selection still exists",
    async (keys) => {
      const groups = mountGroups();
      await groups.selectGroup("1");
      await groups.nextDisplayMode();

      groups.props.clusters = createClusters({ keys, userClusterKey: "0" });
      await nextTick();

      expect(groups.selectedGroup()).toBe("0");
      expect(groups.displayMode()).toBe("current");
    }
  );

  it("uses the first group when the count changes and the user is ungrouped", async () => {
    const groups = mountGroups();
    await groups.selectGroup("2");

    groups.props.clusters = createClusters({
      keys: ["0", "1"],
      userClusterKey: "5",
    });
    await nextTick();

    expect(groups.selectedGroup()).toBe("0");
  });

  it("resets the statement vote scope when the count changes but Me stays on the same key", async () => {
    const groups = mountGroups();
    await groups.nextDisplayMode();

    groups.props.clusters = createClusters({ keys: ["0", "1"] });
    await nextTick();

    expect(groups.selectedGroup()).toBe("0");
    expect(groups.displayMode()).toBe("current");
  });

  it("preserves selector choices on refresh and resets vote scope only when a different group is selected", async () => {
    const groups = mountGroups();
    await groups.selectGroupFromSelector("2");
    await groups.nextDisplayMode();
    await groups.selectGroupFromSelector("2");

    groups.props.clusters = createClusters({ userClusterKey: "1" });
    await nextTick();

    expect(groups.selectedGroup()).toBe("2");
    expect(groups.displayMode()).toBe("all_other_groups");

    await groups.selectGroupFromSelector("1");

    expect(groups.selectedGroup()).toBe("1");
    expect(groups.displayMode()).toBe("current");
  });

  it("falls back to Me if the selected key disappears despite a stable count", async () => {
    const groups = mountGroups();
    await groups.selectGroup("2");

    groups.props.clusters = createClusters({ keys: ["0", "1", "3"] });
    await nextTick();

    expect(groups.selectedGroup()).toBe("0");
  });

  it("preserves selection through a temporary gap in analysis data", async () => {
    const groups = mountGroups();
    await groups.selectGroup("2");

    groups.props.clusters = {};
    await nextTick();
    groups.props.clusters = createClusters({ userClusterKey: "1" });
    await nextTick();

    expect(groups.selectedGroup()).toBe("2");
  });

  it("applies the default when the component switches to another conversation", async () => {
    const groups = mountGroups();
    await groups.selectGroup("2");

    groups.props.conversationSlugId = "conversation-two";
    groups.props.clusters = createClusters({ userClusterKey: "1" });
    await nextTick();

    expect(groups.selectedGroup()).toBe("1");
  });

  it("discards selection history when switching conversations while analysis is empty", async () => {
    const groups = mountGroups();
    await groups.selectGroup("2");
    await groups.nextDisplayMode();

    groups.props.conversationSlugId = "conversation-two";
    groups.props.clusters = {};
    await nextTick();

    groups.props.conversationSlugId = "conversation-one";
    groups.props.clusters = createClusters({ userClusterKey: "1" });
    await nextTick();

    expect(groups.selectedGroup()).toBe("1");
    expect(groups.displayMode()).toBe("current");
  });
});
