import { useEmailUpdateActionPageMetadata } from "src/pages/email-updates/actionPage";
import { type PageMetadataPolicy } from "src/utils/html/pageMetadata";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type App,
  createApp,
  defineComponent,
  h,
  KeepAlive,
  nextTick,
  ref,
} from "vue";

import PageMetadata from "./PageMetadata.vue";

let app: App | undefined;

beforeEach(() => {
  document.head.innerHTML = '<meta name="google" content="notranslate">';
  document.documentElement.className = "theme notranslate";
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

function mountMetadata(initialPolicy: PageMetadataPolicy) {
  const policy = ref(initialPolicy);
  const container = document.createElement("div");
  document.body.append(container);
  app = createApp(() => h(PageMetadata, { policy: policy.value }));
  app.mount(container);
  return policy;
}

function metaContent(name: string): string | undefined {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
    ?.content;
}

describe("PageMetadata", () => {
  it("releases metadata while cached and reapplies the latest policy on activation", async () => {
    const visible = ref(true);
    const policy = ref<PageMetadataPolicy>({
      robots: "noindex, nofollow",
      browserTranslationAllowed: true,
    });
    const container = document.createElement("div");
    document.body.append(container);
    app = createApp(() =>
      h(KeepAlive, undefined, {
        default: () =>
          visible.value ? h(PageMetadata, { policy: policy.value }) : undefined,
      })
    );
    app.mount(container);
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBeUndefined();

    visible.value = false;
    await nextTick();
    expect(metaContent("robots")).toBeUndefined();
    expect(metaContent("google")).toBe("notranslate");
    expect(document.documentElement.getAttribute("translate")).toBe("no");

    policy.value = {
      robots: "noindex, nofollow",
      browserTranslationAllowed: false,
    };
    await nextTick();
    expect(metaContent("robots")).toBeUndefined();

    visible.value = true;
    await nextTick();
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBe("notranslate");

    visible.value = false;
    await nextTick();
    expect(metaContent("robots")).toBeUndefined();
  });

  it("does not rewrite the DOM for a new object with the same policy", async () => {
    const policy = mountMetadata({
      robots: "noindex, nofollow",
      browserTranslationAllowed: false,
    });
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) =>
      mutations.push(...records)
    );
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    policy.value = { ...policy.value };
    await nextTick();
    observer.disconnect();
    expect(mutations).toHaveLength(0);
  });

  it("handles duplicate directives without removing unrelated Google metadata", () => {
    document.head.innerHTML = `
      <meta name="robots" content="index, follow">
      <meta name="ROBOTS" content="noindex">
      <meta name="google" content="nopagereadaloud">
      <meta name="Google" content="NoTranslate">
      <meta name="google" content="notranslate">
    `;
    mountMetadata({ robots: undefined, browserTranslationAllowed: true });
    expect(
      document.head.querySelectorAll('meta[name="robots" i]')
    ).toHaveLength(0);
    expect(
      document.head.querySelectorAll(
        'meta[name="google" i][content="notranslate" i]'
      )
    ).toHaveLength(0);
    expect(metaContent("google")).toBe("nopagereadaloud");

    app?.unmount();
    app = undefined;
    expect(
      Array.from(
        document.head.querySelectorAll<HTMLMetaElement>(
          'meta[name="robots" i]'
        ),
        (meta) => meta.content
      )
    ).toEqual(["index, follow", "noindex"]);
    expect(
      document.head.querySelectorAll(
        'meta[name="google" i][content="notranslate" i]'
      )
    ).toHaveLength(2);
    expect(metaContent("google")).toBe("nopagereadaloud");
  });

  it("preserves exclusions when navigating to and from recipient action pages", async () => {
    const page = ref<"action" | "unlisted" | "listed">("action");
    const ActionPage = defineComponent({
      setup() {
        useEmailUpdateActionPageMetadata("Email preferences");
        return () => h("div");
      },
    });
    const container = document.createElement("div");
    document.body.append(container);
    app = createApp(() => [
      page.value === "action" ? h(ActionPage) : h("div"),
      page.value === "action"
        ? undefined
        : h(PageMetadata, {
            policy: {
              robots:
                page.value === "unlisted" ? "noindex, nofollow" : undefined,
              browserTranslationAllowed: true,
            },
          }),
    ]);
    app.mount(container);
    expect(metaContent("robots")).toBe("noindex, nofollow");

    page.value = "unlisted";
    await nextTick();
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBeUndefined();

    page.value = "action";
    await nextTick();
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBe("notranslate");

    page.value = "listed";
    await nextTick();
    expect(metaContent("robots")).toBeUndefined();
  });

  it("updates robots and all translation signals across conversation transitions", async () => {
    const policy = mountMetadata({
      robots: "noindex, nofollow",
      browserTranslationAllowed: false,
    });
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBe("notranslate");

    policy.value = { robots: undefined, browserTranslationAllowed: true };
    await nextTick();
    expect(metaContent("robots")).toBeUndefined();
    expect(metaContent("google")).toBeUndefined();
    expect(document.documentElement.hasAttribute("translate")).toBe(false);
    expect(document.documentElement.classList.contains("notranslate")).toBe(
      false
    );
    expect(document.documentElement.classList.contains("theme")).toBe(true);

    policy.value = {
      robots: "noindex, nofollow",
      browserTranslationAllowed: false,
    };
    await nextTick();
    expect(metaContent("robots")).toBe("noindex, nofollow");
    expect(metaContent("google")).toBe("notranslate");
    expect(document.documentElement.getAttribute("translate")).toBe("no");
    expect(document.documentElement.classList.contains("notranslate")).toBe(
      true
    );
    expect(document.head.querySelectorAll('meta[name="google"]')).toHaveLength(
      1
    );
  });

  it("restores the application defaults when leaving a conversation", () => {
    mountMetadata({
      robots: "noindex, nofollow",
      browserTranslationAllowed: true,
    });
    app?.unmount();
    app = undefined;
    expect(metaContent("robots")).toBeUndefined();
    expect(metaContent("google")).toBe("notranslate");
    expect(document.documentElement.getAttribute("translate")).toBe("no");
    expect(document.documentElement.className).toBe("theme notranslate");
  });

  it("restores existing metadata without leaving tags or attributes behind", () => {
    document.head.innerHTML = '<meta name="robots" content="noindex">';
    document.documentElement.className = "theme";
    document.documentElement.removeAttribute("translate");
    mountMetadata({
      robots: "noindex, nofollow",
      browserTranslationAllowed: false,
    });
    app?.unmount();
    app = undefined;
    expect(metaContent("robots")).toBe("noindex");
    expect(metaContent("google")).toBeUndefined();
    expect(document.documentElement.hasAttribute("translate")).toBe(false);
    expect(document.documentElement.className).toBe("theme");
  });
});
