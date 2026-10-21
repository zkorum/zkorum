import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { AxiosError } from "axios";
import { createPinia } from "pinia";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h } from "vue";
import { createI18n } from "vue-i18n";

import {
  type CommonApiTranslations,
  commonApiTranslations,
} from "../common.i18n";
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from "./useCommentQueries";

const mocks = vi.hoisted(() => ({
  request: vi.fn<() => Promise<never>>(),
  notify: vi.fn(),
}));
vi.mock("./comment", () => ({
  useBackendCommentApi: () => ({
    createNewComment: mocks.request,
    deleteCommentBySlugId: mocks.request,
  }),
}));
vi.mock("src/utils/ui/notify", () => ({
  useNotify: () => ({ showNotifyMessage: mocks.notify }),
}));
vi.mock("src/stores/authentication", async () => {
  const { defineStore } = await import("pinia");
  return {
    useAuthenticationStore: defineStore("authentication", {
      state: () => ({ userId: "viewer", isLoggedIn: true, isGuest: false }),
    }),
  };
});
vi.mock("src/stores/user", () => ({ useUserStore: () => ({}) }));

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  vi.clearAllMocks();
});

describe.each(["create", "delete"] as const)(
  "asynchronous %s statement error messages",
  (operation) => {
    it.each([
      { code: AxiosError.ERR_NETWORK, translationKey: "networkError" },
      { code: AxiosError.ECONNABORTED, translationKey: "timeoutError" },
      { code: AxiosError.ETIMEDOUT, translationKey: "timeoutError" },
      { code: AxiosError.ERR_CANCELED, translationKey: "requestCanceled" },
      { code: AxiosError.ERR_BAD_RESPONSE, translationKey: "serverError" },
    ] satisfies Array<{
      code: string;
      translationKey: keyof CommonApiTranslations;
    }>)(
      "translates $code outside setup without replacing the original error",
      async ({ code, translationKey }) => {
        const error = new AxiosError("Request failed", code);
        mocks.request.mockRejectedValue(error);
        const i18n = createI18n({ legacy: false, locale: "en", messages: {} });
        const queryClient = new QueryClient();
        let runMutation: (() => Promise<unknown>) | undefined;
        const app = createApp({
          setup() {
            if (operation === "create") {
              const mutation = useCreateCommentMutation();
              runMutation = () =>
                mutation.mutateAsync({
                  commentBody: "A statement",
                  conversationSlugId: "conversation",
                });
            } else {
              const mutation = useDeleteCommentMutation();
              runMutation = () =>
                mutation.mutateAsync({
                  commentSlugId: "statement",
                  conversationSlugId: "conversation",
                  moderation: { status: "unmoderated" },
                });
            }
            return () => h("div");
          },
        });
        app.use(createPinia());
        app.use(i18n);
        app.use(VueQueryPlugin, { queryClient });
        app.mount(document.createElement("div"));
        cleanups.push(() => {
          app.unmount();
          queryClient.clear();
        });
        if (runMutation === undefined)
          throw new Error("Mutation did not mount");

        // The user can change language between setup and a rejected request.
        i18n.global.locale.value = "fr";
        await expect(runMutation()).rejects.toBe(error);
        expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(
          commonApiTranslations.fr[translationKey]
        );
      }
    );
  }
);
