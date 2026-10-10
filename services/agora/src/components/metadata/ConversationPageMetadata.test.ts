import type { ConversationMetadata } from "src/shared/types/zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, h, nextTick, ref, shallowRef } from "vue";

vi.mock("src/utils/api/post/useConversationQuery", () => ({
  useConversationQuery: () => ({ data: queryData }),
}));

import ConversationPageMetadata from "./ConversationPageMetadata.vue";

type Metadata = Pick<
  ConversationMetadata,
  "conversationSlugId" | "isIndexed" | "multilingualSetting"
>;
const queryData = shallowRef<
  { conversationData: { metadata: Metadata } } | undefined
>();
let app: App | undefined;

beforeEach(() => {
  queryData.value = undefined;
  document.head.innerHTML = '<meta name="google" content="notranslate">';
  document.documentElement.className = "notranslate";
  document.documentElement.setAttribute("translate", "no");
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  document.head.replaceChildren();
  document.body.replaceChildren();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("translate");
});

function mountConversationMetadata() {
  const slugId = ref("current");
  const container = document.createElement("div");
  document.body.append(container);
  app = createApp({
    render: () =>
      h(ConversationPageMetadata, { conversationSlugId: slugId.value }),
  });
  app.mount(container);
  return slugId;
}

function metaContent(name: string): string | undefined {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
    ?.content;
}

describe("ConversationPageMetadata", () => {
  it.each([
    { isIndexed: true, dynamicTranslationEnabled: true },
    { isIndexed: true, dynamicTranslationEnabled: false },
    { isIndexed: false, dynamicTranslationEnabled: true },
    { isIndexed: false, dynamicTranslationEnabled: false },
  ])(
    "uses the effective conversation policy: %j",
    ({ isIndexed, dynamicTranslationEnabled }) => {
      queryData.value = {
        conversationData: {
          metadata: {
            conversationSlugId: "current",
            isIndexed,
            multilingualSetting: {
              additionalLanguageCodes: [],
              dynamicTranslationEnabled,
            },
          },
        },
      };
      mountConversationMetadata();
      expect(metaContent("robots")).toBe(
        isIndexed ? undefined : "noindex, nofollow"
      );
      expect(metaContent("google")).toBe(
        dynamicTranslationEnabled ? "notranslate" : undefined
      );
      expect(document.documentElement.classList.contains("notranslate")).toBe(
        dynamicTranslationEnabled
      );
      expect(document.documentElement.getAttribute("translate")).toBe(
        dynamicTranslationEnabled ? "no" : null
      );
    }
  );

  it("excludes unloaded pages and never applies the previous conversation's policy", async () => {
    const slugId = mountConversationMetadata();
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBe("notranslate");

    queryData.value = {
      conversationData: {
        metadata: {
          conversationSlugId: "current",
          isIndexed: true,
          multilingualSetting: {
            additionalLanguageCodes: [],
            dynamicTranslationEnabled: false,
          },
        },
      },
    };
    await nextTick();
    expect(metaContent("robots")).toBeUndefined();
    expect(metaContent("google")).toBeUndefined();

    slugId.value = "next";
    await nextTick();
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBe("notranslate");
  });
});
