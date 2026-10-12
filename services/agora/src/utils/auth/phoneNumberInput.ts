import {
  type CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";
import {
  type SupportedCountryCallingCode,
  zodSupportedCountryCallingCode,
} from "src/shared/types/zod";
import { isPhoneNumberTypeSupported } from "src/shared-app-api/phone";

import type { PhoneAuthAvailability } from "./phoneAuthMode";

type PhoneNumberInputResult =
  | {
      success: false;
      error:
        | "missing_number"
        | "invalid_number"
        | "unsupported_country"
        | "registration_unavailable"
        | "unsupported_type";
    }
  | {
      success: true;
      phoneNumber: {
        countryCallingCode: SupportedCountryCallingCode;
        internationalPhoneNumber: string;
      };
    };

export function parsePhoneNumberInput({
  phoneNumber,
  defaultCountry,
  availabilityForCountry,
}: {
  phoneNumber: string | null;
  defaultCountry: CountryCode | null;
  availabilityForCountry: (country: CountryCode) => PhoneAuthAvailability;
}): PhoneNumberInputResult {
  if (phoneNumber === null || phoneNumber.trim() === "") {
    return { success: false, error: "missing_number" };
  }
  const parsed = parsePhoneNumberFromString(
    phoneNumber,
    defaultCountry ?? undefined
  );
  if (parsed?.isValid() !== true) {
    return { success: false, error: "invalid_number" };
  }
  const callingCode = zodSupportedCountryCallingCode.safeParse(
    parsed.countryCallingCode
  );
  if (!callingCode.success || parsed.country === undefined) {
    return { success: false, error: "unsupported_country" };
  }
  const availability = availabilityForCountry(parsed.country);
  if (!availability.available) {
    const error =
      availability.reason === "registration_unavailable"
        ? "registration_unavailable"
        : "unsupported_country";
    return { success: false, error };
  }
  if (!isPhoneNumberTypeSupported(parsed.getType())) {
    return { success: false, error: "unsupported_type" };
  }
  return {
    success: true,
    phoneNumber: {
      countryCallingCode: callingCode.data,
      internationalPhoneNumber: parsed.number,
    },
  };
}
