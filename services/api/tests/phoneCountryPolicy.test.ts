import Fastify from "fastify";
import {
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import {
    defaultPhoneAuthenticationCountries,
    defaultPhoneRegistrationCountries,
    getCountryPhoneAuthMode,
    phoneCountryPolicySchema,
    type PhoneCountry,
} from "../src/shared/types/phone-country-policy.js";
import {
    registerPhonePolicyRoute,
    resolveCountryPhoneAuth,
} from "../src/service/phoneCountryPolicy.js";
import type { PhoneAuth } from "../src/service/auth.js";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";

const policy = phoneCountryPolicySchema.parse({
    authenticationCountries: defaultPhoneAuthenticationCountries,
    registrationCountries: defaultPhoneRegistrationCountries,
});
const enabled: PhoneAuth = {
    mode: "enabled",
    minimumResponseTimeMs: 2000,
    responseJitterMs: 500,
    delivery: { type: "local", testCode: 0, speciallyAuthorizedPhones: [] },
};

describe("phone country policy", () => {
    it.each([
        ["+33612345678", "enabled"],
        ["+355691234567", "enabled"],
        ["+38640123456", "enabled"],
        ["+59995181234", "enabled"],
        ["+5993181234", "enabled"],
        ["+17215205678", "enabled"],
        ["+447624123456", "enabled"],
        ["+447781123456", "enabled"],
        ["+447797123456", "enabled"],
        ["+2463801234", "enabled"],
        ["+5491112345678", "login_only"],
        ["+919876543210", "login_only"],
        ["+66812345678", "login_only"],
        ["+380501234567", "login_only"],
        ["+996700123456", "login_only"],
        ["+2348031234567", "login_only"],
        ["+251911234567", "disabled"],
        ["not-a-phone", "disabled"],
    ])("resolves the actual destination %s as %s", (phoneNumber, expected) => {
        const result = resolveCountryPhoneAuth({
            phoneAuth: enabled,
            country: parsePhoneNumberFromString(phoneNumber)?.country,
            policy,
        });
        expect(result.mode).toBe(expected);
        if (result.mode !== "disabled")
            expect(result.minimumResponseTimeMs).toBe(2000);
    });

    it("permits enrollment across every EU destination while retaining country-specific login restrictions", () => {
        const euCountries: PhoneCountry[] = [
            "AT",
            "BE",
            "BG",
            "HR",
            "CY",
            "CZ",
            "DK",
            "EE",
            "FI",
            "FR",
            "DE",
            "GR",
            "HU",
            "IE",
            "IT",
            "LV",
            "LT",
            "LU",
            "MT",
            "NL",
            "PL",
            "PT",
            "RO",
            "SK",
            "SI",
            "ES",
            "SE",
        ];
        for (const country of euCountries) {
            expect(
                getCountryPhoneAuthMode({ mode: "enabled", country, policy }),
            ).toBe("enabled");
        }
        const loginOnlyCountries: PhoneCountry[] = [
            "AR",
            "BD",
            "CM",
            "GE",
            "GW",
            "IN",
            "KE",
            "KG",
            "MX",
            "NG",
            "RS",
            "TH",
            "UA",
            "VN",
        ];
        for (const country of loginOnlyCountries) {
            expect(
                getCountryPhoneAuthMode({ mode: "enabled", country, policy }),
            ).toBe("login_only");
        }
    });

    it("keeps global pauses authoritative and does not confuse shared calling codes", () => {
        expect(
            resolveCountryPhoneAuth({
                phoneAuth: { ...enabled, mode: "login_only" },
                country: "FR",
                policy,
            }).mode,
        ).toBe("login_only");
        expect(
            resolveCountryPhoneAuth({
                phoneAuth: { mode: "disabled" },
                country: "FR",
                policy,
            }).mode,
        ).toBe("disabled");
        const usOnly = phoneCountryPolicySchema.parse({
            authenticationCountries: ["US"],
            registrationCountries: ["US"],
        });
        expect(
            resolveCountryPhoneAuth({
                phoneAuth: enabled,
                country: parsePhoneNumberFromString("+14165552671")?.country,
                policy: usOnly,
            }).mode,
        ).toBe("disabled");
    });

    it("rejects invalid, duplicate, or unsupported registration configuration", () => {
        expect(
            phoneCountryPolicySchema.safeParse({
                authenticationCountries: ["US"],
                registrationCountries: ["UA"],
            }).success,
        ).toBe(false);
        expect(
            phoneCountryPolicySchema.safeParse({
                authenticationCountries: ["US", "US"],
                registrationCountries: [],
            }).success,
        ).toBe(false);
        expect(
            phoneCountryPolicySchema.safeParse({
                authenticationCountries: ["ZZ"],
                registrationCountries: [],
            }).success,
        ).toBe(false);
        for (const legacyCode of ["AN", "YU", "UM"]) {
            expect(
                phoneCountryPolicySchema.safeParse({
                    authenticationCountries: [legacyCode],
                    registrationCountries: [],
                }).success,
            ).toBe(false);
        }
        const closed = phoneCountryPolicySchema.parse({
            authenticationCountries: ["US"],
            registrationCountries: [],
        });
        expect(
            resolveCountryPhoneAuth({
                phoneAuth: enabled,
                country: "US",
                policy: closed,
            }).mode,
        ).toBe("login_only");
    });

    it("exposes only public rules and rejects number-specific policy probes", async () => {
        const server = Fastify();
        server.setValidatorCompiler(validatorCompiler);
        server.setSerializerCompiler(serializerCompiler);
        registerPhonePolicyRoute({
            server,
            apiVersion: "v1",
            getPolicy: async () => ({ mode: "enabled", countryPolicy: policy }),
        });
        try {
            const response = await server.inject({
                method: "POST",
                url: "/api/v1/auth/phone/policy",
                payload: {},
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({
                mode: "enabled",
                countryPolicy: policy,
            });
            expect(
                (
                    await server.inject({
                        method: "POST",
                        url: "/api/v1/auth/phone/policy",
                        payload: { phoneNumber: "+14155552671" },
                    })
                ).statusCode,
            ).toBe(400);
        } finally {
            await server.close();
        }
    });
});
