import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import {
    getCountryPhoneAuthMode,
    phonePolicyResponseSchema,
    type PhoneCountryPolicy,
    type PhonePolicyResponse,
} from "@/shared/types/phone-country-policy.js";
import type { PhoneAuth } from "./auth.js";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export function resolveCountryPhoneAuth({
    phoneAuth,
    phoneNumber,
    policy,
}: {
    phoneAuth: PhoneAuth;
    phoneNumber: string;
    policy: PhoneCountryPolicy;
}): PhoneAuth {
    if (phoneAuth.mode === "disabled") return phoneAuth;
    const country = parsePhoneNumberFromString(phoneNumber)?.country;
    const mode = getCountryPhoneAuthMode({
        mode: phoneAuth.mode,
        country,
        policy,
    });
    return mode === "disabled" ? { mode } : { ...phoneAuth, mode };
}

export function registerPhonePolicyRoute({
    server,
    apiVersion,
    getPolicy,
}: {
    server: FastifyInstance;
    apiVersion: string;
    getPolicy: () => Promise<PhonePolicyResponse>;
}): void {
    server.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: `/api/${apiVersion}/auth/phone/policy`,
        schema: {
            body: z.object({}).strict(),
            response: { 200: phonePolicyResponseSchema },
            security: [],
        },
        handler: getPolicy,
    });
}
