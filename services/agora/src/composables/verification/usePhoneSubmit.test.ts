import { createPinia, setActivePinia } from "pinia";
import {
  type PhoneVerificationData,
  phoneVerificationStore,
} from "src/stores/onboarding/phone";
import type { useAuthPhoneApi } from "src/utils/api/auth-phone";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, defineComponent } from "vue";
import {
  createMemoryHistory,
  createRouter,
  type NavigationFailure,
} from "vue-router";

import { usePhoneSubmit } from "./usePhoneSubmit";

const { sendSmsCode, processEnv } = vi.hoisted(() => {
  const processEnv: { VITE_TURNSTILE_SITE_KEY: string | undefined } = {
    VITE_TURNSTILE_SITE_KEY: undefined,
  };
  return {
    sendSmsCode: vi.fn<ReturnType<typeof useAuthPhoneApi>["sendSmsCode"]>(),
    processEnv,
  };
});

vi.mock("src/utils/api/auth-phone", () => ({
  useAuthPhoneApi: () => ({ sendSmsCode }),
}));
vi.mock("src/utils/processEnv", () => ({ processEnv }));
vi.mock("src/composables/ui/useComponentI18n", () => ({
  useComponentI18n: () => ({ t: (key: string) => key }),
}));

const firstPhone: PhoneVerificationData = {
  internationalPhoneNumber: "+33612345678",
  countryCallingCode: "33",
};
const secondPhone: PhoneVerificationData = {
  internationalPhoneNumber: "+14162223333",
  countryCallingCode: "1",
};
const successResponse = {
  status: "success",
  data: {
    success: true,
    codeExpiry: new Date("2030-01-01T00:10:00Z"),
    nextCodeSoonestTime: new Date("2030-01-01T00:00:30Z"),
  },
} satisfies Awaited<
  ReturnType<ReturnType<typeof useAuthPhoneApi>["sendSmsCode"]>
>;

const mountedApps: App[] = [];

async function mountSubmit() {
  const ready = Promise.withResolvers<ReturnType<typeof usePhoneSubmit>>();
  const navigate = vi.fn<() => Promise<void | NavigationFailure>>();
  navigate.mockResolvedValue(undefined);
  const notify = vi.fn<(message: string) => void>();
  const app = createApp(
    defineComponent({
      setup() {
        ready.resolve(
          usePhoneSubmit({
            purpose: "login",
            takeTurnstileToken: () => undefined,
            onNavigateToOtp: navigate,
            onAlreadyHasCredential: () => undefined,
            showNotifyMessage: notify,
            translations: {
              throttled: "throttled",
              invalidPhoneNumber: "invalidPhoneNumber",
              restrictedPhoneType: "restrictedPhoneType",
              somethingWrong: "somethingWrong",
            },
          })
        );
        return () => null;
      },
    })
  );
  app.mount(document.createElement("div"));
  mountedApps.push(app);
  return { submit: await ready.promise, navigate, notify };
}

beforeEach(() => {
  setActivePinia(createPinia());
  sendSmsCode.mockReset();
  sendSmsCode.mockResolvedValue(successResponse);
  processEnv.VITE_TURNSTILE_SITE_KEY = undefined;
});

afterEach(() => {
  for (const app of mountedApps.splice(0)) app.unmount();
});

describe("phone submission lifecycle", () => {
  it("keeps the first number and sends one request across same-tick clicks and a delayed navigation", async () => {
    const response =
      Promise.withResolvers<Awaited<ReturnType<typeof sendSmsCode>>>();
    const navigation = Promise.withResolvers<void>();
    sendSmsCode.mockReturnValue(response.promise);
    const { submit, navigate } = await mountSubmit();
    navigate.mockReturnValue(navigation.promise);

    const pending = submit.submitPhone(firstPhone);
    await submit.submitPhone(secondPhone);

    expect(sendSmsCode).toHaveBeenCalledOnce();
    expect(sendSmsCode).toHaveBeenCalledWith(
      expect.objectContaining({
        phoneNumber: firstPhone.internationalPhoneNumber,
        defaultCallingCode: firstPhone.countryCallingCode,
      })
    );
    expect(phoneVerificationStore().verificationPhoneNumber).toEqual(
      firstPhone
    );
    expect(submit.isLoading.value).toBe(true);

    response.resolve(successResponse);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledOnce());
    await submit.submitPhone(secondPhone);
    expect(submit.isLoading.value).toBe(true);
    expect(sendSmsCode).toHaveBeenCalledOnce();
    expect(phoneVerificationStore().verificationPhoneNumber).toEqual(
      firstPhone
    );

    navigation.resolve();
    await pending;
    expect(submit.isLoading.value).toBe(false);
  });

  it.each(["cancelled", "rejected"])(
    "allows retry after %s navigation",
    async (failure) => {
      const { submit, navigate, notify } = await mountSubmit();
      if (failure === "cancelled") {
        const router = createRouter({
          history: createMemoryHistory(),
          routes: [
            { path: "/", component: {} },
            { path: "/otp", component: {} },
          ],
        });
        await router.push("/");
        router.beforeEach(() => false);
        navigate.mockImplementationOnce(async () => await router.push("/otp"));
      } else {
        navigate.mockRejectedValueOnce(new Error("Navigation failed"));
      }

      await submit.submitPhone(firstPhone);
      expect(submit.isLoading.value).toBe(false);
      expect(notify).toHaveBeenCalledWith("somethingWrong");

      await submit.submitPhone(firstPhone);
      expect(sendSmsCode).toHaveBeenCalledTimes(2);
      expect(navigate).toHaveBeenCalledTimes(2);
    }
  );

  it("ignores an in-flight response after the page unmounts", async () => {
    const response =
      Promise.withResolvers<Awaited<ReturnType<typeof sendSmsCode>>>();
    sendSmsCode.mockReturnValue(response.promise);
    const { submit, navigate, notify } = await mountSubmit();
    const pending = submit.submitPhone(firstPhone);
    for (const app of mountedApps.splice(0)) app.unmount();

    response.resolve(successResponse);
    await pending;
    expect(navigate).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    expect(phoneVerificationStore().pendingOtpData).toBeNull();
  });

  it("honors a restored cooldown before accepting another number", async () => {
    const store = phoneVerificationStore();
    store.verificationPhoneNumber = firstPhone;
    store.requestCodeThrottleUntil = new Date(Date.now() + 30_000);
    const { submit } = await mountSubmit();

    await submit.submitPhone(secondPhone);
    expect(submit.nextCodeWaitSeconds.value).toBeGreaterThan(0);
    expect(sendSmsCode).not.toHaveBeenCalled();
    expect(store.verificationPhoneNumber).toEqual(firstPhone);
  });

  it("requires a security token before accepting a request when Turnstile is enabled", async () => {
    processEnv.VITE_TURNSTILE_SITE_KEY = "test-site-key";
    const { submit, notify } = await mountSubmit();

    await submit.submitPhone(firstPhone);
    expect(sendSmsCode).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("retrySecurityCheck");
    expect(submit.isLoading.value).toBe(false);
    expect(
      phoneVerificationStore().verificationPhoneNumber.internationalPhoneNumber
    ).toBe("");
  });
});
