/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MODIFY THIS FILE DIRECTLY! **** **/
import { getCountries } from "libphonenumber-js/max";
import { z } from "zod";
import { phoneAuthModeSchema, type PhoneAuthMode } from "./phone-auth.js";

export const phoneCountrySchema = z.enum(getCountries());
export type PhoneCountry = z.infer<typeof phoneCountrySchema>;

export const defaultPhoneRegistrationCountries: PhoneCountry[] = [
    "AD",
    "AE",
    "AL",
    "AS",
    "AT",
    "AU",
    "AX",
    "BA",
    "BE",
    "BG",
    "BQ",
    "BR",
    "BY",
    "CA",
    "CH",
    "CW",
    "CY",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FO",
    "FR",
    "GB",
    "GG",
    "GI",
    "GL",
    "GP",
    "GR",
    "HK",
    "HR",
    "HU",
    "IE",
    "IM",
    "IO",
    "IS",
    "IT",
    "JE",
    "JP",
    "KR",
    "LI",
    "LT",
    "LU",
    "LV",
    "MC",
    "MD",
    "ME",
    "MF",
    "MK",
    "MQ",
    "MT",
    "NC",
    "NL",
    "NO",
    "NZ",
    "PF",
    "PL",
    "PM",
    "PT",
    "RE",
    "RO",
    "SE",
    "SG",
    "SI",
    "SJ",
    "SK",
    "SM",
    "SX",
    "TW",
    "US",
    "VA",
    "VG",
    "VI",
    "XK",
];
export const defaultPhoneAuthenticationCountries: PhoneCountry[] = [
    ...defaultPhoneRegistrationCountries,
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
export const phoneCountryPolicySchema = z
    .object({
        authenticationCountries: z.array(phoneCountrySchema),
        registrationCountries: z.array(phoneCountrySchema),
    })
    .strict()
    .superRefine((policy, ctx) => {
        for (const key of [
            "authenticationCountries",
            "registrationCountries",
        ] satisfies (keyof typeof policy)[]) {
            if (new Set(policy[key]).size !== policy[key].length) {
                ctx.addIssue({
                    code: "custom",
                    path: [key],
                    message: "Countries must be unique",
                });
            }
        }
        if (
            policy.registrationCountries.some(
                (country) => !policy.authenticationCountries.includes(country),
            )
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["registrationCountries"],
                message:
                    "Registration countries must allow phone authentication",
            });
        }
    });
export type PhoneCountryPolicy = z.infer<typeof phoneCountryPolicySchema>;
export const phonePolicyResponseSchema = z
    .object({
        mode: phoneAuthModeSchema,
        countryPolicy: phoneCountryPolicySchema,
    })
    .strict();
export type PhonePolicyResponse = z.infer<typeof phonePolicyResponseSchema>;

export function getCountryPhoneAuthMode({
    mode,
    country,
    policy,
}: {
    mode: PhoneAuthMode;
    country: PhoneCountry | undefined;
    policy: PhoneCountryPolicy;
}): PhoneAuthMode {
    if (
        mode === "disabled" ||
        country === undefined ||
        !policy.authenticationCountries.includes(country)
    )
        return "disabled";
    if (
        mode === "login_only" ||
        !policy.registrationCountries.includes(country)
    )
        return "login_only";
    return "enabled";
}
