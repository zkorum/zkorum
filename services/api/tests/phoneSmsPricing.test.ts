import { describe, expect, it } from "vitest";
import {
    defaultPhoneAuthenticationCountries,
    type PhoneCountry,
} from "../src/shared/types/phone-country-policy.js";
import {
    getDefaultPhoneSmsCostCents,
    phoneSmsCostOverridesSchema,
} from "../src/service/phoneSmsPricing.js";

describe("destination SMS estimates", () => {
    it.each([
        ["FR", 26],
        ["DE", 33],
        ["AE", 35],
        ["UA", 61],
        ["KG", 117],
        ["BD", 150],
        ["US", 15],
        ["BA", 129],
        ["BQ", 48],
        ["CW", 48],
        ["SX", 48],
        ["PL", 17],
        ["XK", 67],
        ["IO", 195],
    ] satisfies Array<
        [Parameters<typeof getDefaultPhoneSmsCostCents>[0], number]
    >)("conservatively rounds %s to %s cents", (country, cents) => {
        expect(getDefaultPhoneSmsCostCents(country)).toBe(cents);
    });
    it("covers every default supported country and leaves unreviewed routes unpriced", () => {
        for (const country of defaultPhoneAuthenticationCountries)
            expect(getDefaultPhoneSmsCostCents(country)).toBeGreaterThan(0);
        expect(getDefaultPhoneSmsCostCents("VE")).toBeUndefined();
    });
    it.each([
        ["AX", "FI"],
        ["IM", "GB"],
        ["MF", "GP"],
        ["SJ", "NO"],
        ["VA", "IT"],
    ] satisfies Array<[PhoneCountry, PhoneCountry]>)(
        "prices territory %s using its reviewed %s billing route",
        (territory, billingCountry) => {
            expect(getDefaultPhoneSmsCostCents(territory)).toBe(
                getDefaultPhoneSmsCostCents(billingCountry),
            );
        },
    );
    it("parses only positive integer overrides for recognized country codes", () => {
        expect(phoneSmsCostOverridesSchema.parse({ FR: 30 })).toEqual({
            FR: 30,
        });
        expect(phoneSmsCostOverridesSchema.safeParse({ FR: 0 }).success).toBe(
            false,
        );
        expect(phoneSmsCostOverridesSchema.safeParse({ FR: 1.5 }).success).toBe(
            false,
        );
        expect(phoneSmsCostOverridesSchema.safeParse({ ZZ: 30 }).success).toBe(
            false,
        );
    });
});
