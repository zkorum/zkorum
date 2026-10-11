import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h } from "vue";

import { usePhoneCountryPolicy } from "./usePhoneCountryPolicy";

const { fetchPolicy } = vi.hoisted(() => ({ fetchPolicy: vi.fn() }));
vi.mock("src/utils/api/auth-phone", () => ({
  useAuthPhoneApi: () => ({ fetchPhonePolicy: fetchPolicy }),
}));
vi.mock("src/utils/processEnv", () => ({
  processEnv: { VITE_PHONE_AUTH_MODE: "enabled" },
}));

describe("phone policy frontend", () => {
  it("shares fetched rules, permits island enrollment, and preserves login-only access", async () => {
    fetchPolicy.mockResolvedValue({
      mode: "enabled",
      countryPolicy: {
        authenticationCountries: ["FR", "UA", "CW", "BQ", "IM"],
        registrationCountries: ["FR", "CW", "BQ", "IM"],
      },
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const component = defineComponent({
      setup() {
        const policy = usePhoneCountryPolicy();
        return () =>
          h(
            "div",
            JSON.stringify({
              ready: policy.isReady.value,
              loginCountries: policy.countriesFor("login"),
              registrationCountries: policy.countriesFor("registration"),
              login: policy.availabilityFor({ purpose: "login", country: "UA" })
                .available,
              credential: policy.availabilityFor({
                purpose: "credential",
                country: "UA",
              }).available,
              islandCredential: policy.availabilityFor({
                purpose: "credential",
                country: "CW",
              }).available,
            })
          );
      },
    });
    const app = createApp(component);
    app.use(VueQueryPlugin, { queryClient: client });
    const target = document.createElement("div");
    document.body.append(target);
    app.mount(target);
    try {
      await vi.waitFor(() =>
        expect(JSON.parse(target.textContent ?? "")).toEqual({
          ready: true,
          loginCountries: ["FR", "UA", "CW", "BQ", "IM"],
          registrationCountries: ["FR", "CW", "BQ", "IM"],
          login: true,
          credential: false,
          islandCredential: true,
        })
      );
      fetchPolicy.mockResolvedValue({
        mode: "login_only",
        countryPolicy: {
          authenticationCountries: ["FR", "UA", "CW", "BQ", "IM"],
          registrationCountries: ["FR", "CW", "BQ", "IM"],
        },
      });
      await client.invalidateQueries({ queryKey: ["phone-auth-policy"] });
      await vi.waitFor(() =>
        expect(JSON.parse(target.textContent ?? "")).toMatchObject({
          login: true,
          registrationCountries: [],
          islandCredential: false,
        })
      );
    } finally {
      app.unmount();
      target.remove();
      client.clear();
    }
  });
});
