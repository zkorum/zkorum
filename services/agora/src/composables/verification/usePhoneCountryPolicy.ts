import { useQuery } from "@tanstack/vue-query";
import {
  getCountryPhoneAuthMode,
  type PhoneCountry,
} from "src/shared/types/phone-country-policy";
import { useAuthPhoneApi } from "src/utils/api/auth-phone";
import {
  getEffectivePhoneAuthMode,
  getPhoneAuthAvailability,
  type PhoneAuthPurpose,
  updateBackendPhoneAuthMode,
} from "src/utils/auth/phoneAuthMode";
import { processEnv } from "src/utils/processEnv";
import { computed, watch } from "vue";

export function usePhoneCountryPolicy() {
  const { fetchPhonePolicy } = useAuthPhoneApi();
  const query = useQuery({
    queryKey: ["phone-auth-policy"],
    queryFn: fetchPhonePolicy,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  watch(
    () => query.data.value?.mode,
    (mode) => {
      if (mode !== undefined) updateBackendPhoneAuthMode(mode);
    },
    { immediate: true }
  );

  function countriesFor(purpose: PhoneAuthPurpose): PhoneCountry[] {
    const policy = query.data.value;
    if (policy === undefined) return [];
    const mode = getEffectivePhoneAuthMode({
      configuredMode: processEnv.VITE_PHONE_AUTH_MODE ?? "enabled",
      backendMode: policy.mode,
    });
    if (mode === "disabled" || (purpose !== "login" && mode === "login_only"))
      return [];
    return purpose === "login"
      ? policy.countryPolicy.authenticationCountries
      : policy.countryPolicy.registrationCountries;
  }

  function availabilityFor({
    purpose,
    country,
  }: {
    purpose: PhoneAuthPurpose;
    country: PhoneCountry | undefined;
  }) {
    const policy = query.data.value;
    if (policy === undefined)
      return getPhoneAuthAvailability({ mode: "disabled", purpose });
    const mode = getEffectivePhoneAuthMode({
      configuredMode: processEnv.VITE_PHONE_AUTH_MODE ?? "enabled",
      backendMode: policy.mode,
    });
    return getPhoneAuthAvailability({
      mode: getCountryPhoneAuthMode({
        mode,
        country,
        policy: policy.countryPolicy,
      }),
      purpose,
    });
  }

  return {
    isReady: computed(() => query.data.value !== undefined),
    isPending: query.isPending,
    isError: query.isError,
    countriesFor,
    availabilityFor,
    refresh: query.refetch,
  };
}
