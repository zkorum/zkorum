import { createTurnstileVerifier } from "./turnstile.js";
import { PHONE_SMS_TURNSTILE_ACTION } from "@/shared/types/turnstile.js";

export function createPhoneTurnstileVerifier({
    secretKey,
    allowedHostnames,
    fetchSiteverify = fetch,
    log,
}: {
    secretKey: string;
    allowedHostnames: readonly string[];
    fetchSiteverify?: typeof fetch;
    log: Pick<Console, "warn">;
}) {
    return createTurnstileVerifier({
        secretKey,
        allowedHostnames,
        action: PHONE_SMS_TURNSTILE_ACTION,
        fetchSiteverify,
        logError: (error) => {
            log.warn(error, "[Phone Turnstile] Siteverify failed");
        },
    });
}
