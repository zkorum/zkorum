import { describe, expect, it, vi } from "vitest";

import { parsePhoneNumberInput } from "./phoneNumberInput";

describe("canonical phone input", () => {
  it("canonicalizes a national number using the selected country", () => {
    expect(
      parsePhoneNumberInput({
        phoneNumber: "(415) 555-2671",
        defaultCountry: "US",
        availabilityForCountry: () => ({ available: true }),
      })
    ).toEqual({
      success: true,
      phoneNumber: {
        countryCallingCode: "1",
        internationalPhoneNumber: "+14155552671",
      },
    });
  });

  it("checks the actual pasted destination rather than the selected country", () => {
    const availability = vi.fn(
      () =>
        ({
          available: false,
          reason: "registration_unavailable",
        }) satisfies { available: false; reason: "registration_unavailable" }
    );
    expect(
      parsePhoneNumberInput({
        phoneNumber: "+380501234567",
        defaultCountry: "FR",
        availabilityForCountry: availability,
      })
    ).toEqual({ success: false, error: "registration_unavailable" });
    expect(availability).toHaveBeenCalledWith("UA");
  });

  it("keeps a modern Dutch territory distinct from the country picker hint", () => {
    const availability = vi.fn(
      () => ({ available: true }) satisfies { available: true }
    );
    expect(
      parsePhoneNumberInput({
        phoneNumber: "+59995181234",
        defaultCountry: "US",
        availabilityForCountry: availability,
      })
    ).toEqual({
      success: true,
      phoneNumber: {
        countryCallingCode: "599",
        internationalPhoneNumber: "+59995181234",
      },
    });
    expect(availability).toHaveBeenCalledWith("CW");
  });

  it.each([null, "", "   "])("rejects missing input %s", (phoneNumber) => {
    const availability = vi.fn(
      () => ({ available: true }) satisfies { available: true }
    );
    expect(
      parsePhoneNumberInput({
        phoneNumber,
        defaultCountry: "FR",
        availabilityForCountry: availability,
      })
    ).toEqual({ success: false, error: "missing_number" });
    expect(availability).not.toHaveBeenCalled();
  });

  it("rejects invalid numbers and unsupported number types", () => {
    expect(
      parsePhoneNumberInput({
        phoneNumber: "not-a-number",
        defaultCountry: "FR",
        availabilityForCountry: () => ({ available: true }),
      })
    ).toEqual({ success: false, error: "invalid_number" });
    expect(
      parsePhoneNumberInput({
        phoneNumber: "+33800123456",
        defaultCountry: "FR",
        availabilityForCountry: () => ({ available: true }),
      })
    ).toEqual({ success: false, error: "unsupported_type" });
  });
});
