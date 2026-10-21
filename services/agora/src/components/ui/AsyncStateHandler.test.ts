import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, h, ref } from "vue";

vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));
import AsyncStateHandler from "./AsyncStateHandler.vue";

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.replaceChildren();
});

function renderFailedRefresh({
  retain,
  error,
  data,
}: {
  retain: boolean;
  error: Error;
  data: { frameId: number } | undefined;
}): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  app = createApp({
    setup: () => () =>
      h(
        AsyncStateHandler,
        {
          query: {
            isPending: ref(false),
            isError: ref(true),
            error: ref(error),
            isRefetching: ref(false),
            data: ref(data),
            refetch: async () => await Promise.resolve(),
          },
          retainDataOnError: retain,
        },
        {
          default: () => "published frame 7",
          error: () => "refresh failed",
        }
      ),
  });
  app.mount(host);
  return host;
}

describe("retaining a published frame during refresh failures", () => {
  it("keeps existing content on an opted-in transient refresh failure", () => {
    const host = renderFailedRefresh({
      retain: true,
      error: new Error("network unavailable"),
      data: { frameId: 7 },
    });
    expect(host.textContent).toContain("published frame 7");
    expect(host.textContent).not.toContain("refresh failed");
  });

  it("still shows initial-load errors and preserves the default error behavior", () => {
    expect(
      renderFailedRefresh({
        retain: true,
        error: new Error("unavailable"),
        data: undefined,
      }).textContent
    ).toBe("refresh failed");
  });

  it.each([401, 403, 404])("does not retain content after HTTP %s", (status) => {
    const error = new AxiosError("Forbidden", undefined, undefined, undefined, {
      status,
      statusText: "Forbidden",
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    expect(
      renderFailedRefresh({ retain: true, error, data: { frameId: 7 } })
        .textContent
    ).toBe("refresh failed");
  });

  it("does not change error handling for components that did not opt in", () => {
    expect(
      renderFailedRefresh({
        retain: false,
        error: new Error("unavailable"),
        data: { frameId: 7 },
      }).textContent
    ).toBe("refresh failed");
  });
});
