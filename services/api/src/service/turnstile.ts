import { z } from "zod";
import type { TurnstileAction } from "@/shared/types/turnstile.js";

const siteverifyResponse = z.object({
    success: z.boolean(),
    hostname: z.string().optional(),
    action: z.string().optional(),
});
const tokenSchema = z.string().min(1).max(2048);

export function createTurnstileVerifier({
    secretKey,
    allowedHostnames,
    action,
    fetchSiteverify = fetch,
    logError,
}: {
    secretKey: string;
    allowedHostnames: readonly string[];
    action: TurnstileAction;
    fetchSiteverify?: typeof fetch;
    logError: (error: unknown) => void;
}) {
    const verify = async (rawToken: unknown): Promise<boolean> => {
        const token = tokenSchema.safeParse(rawToken);
        if (!token.success) return false;
        try {
            const response = await fetchSiteverify(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        secret: secretKey,
                        response: token.data,
                    }),
                    signal: AbortSignal.timeout(4000),
                },
            );
            if (!response.ok) return false;
            const parsed = siteverifyResponse.safeParse(await response.json());
            return (
                parsed.success &&
                parsed.data.success &&
                parsed.data.action === action &&
                parsed.data.hostname !== undefined &&
                allowedHostnames.includes(parsed.data.hostname)
            );
        } catch (error) {
            logError(error);
            return false;
        }
    };
    return { verify };
}
