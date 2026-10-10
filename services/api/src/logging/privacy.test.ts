import Fastify from "fastify";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApiLogPrivacy, logApiError } from "./privacy.js";

function captureServer() {
    const lines: string[] = [];
    const privacy = createApiLogPrivacy(new URL("../", import.meta.url));
    const server = Fastify({
        logger: {
            level: "info",
            ...privacy.options,
            stream: {
                write(line) {
                    lines.push(line);
                },
            },
        },
        trustProxy: ["loopback", "uniquelocal"],
    });
    privacy.registerRoutes(server);
    return {
        server,
        lines,
        records: () =>
            lines.map((line) => {
                const parsed: unknown = JSON.parse(line);
                return z.record(z.string(), z.unknown()).parse(parsed);
            }),
    };
}

describe("API logging privacy", () => {
    it("logs route templates and status without URL capabilities, headers, body or IP", async () => {
        const capture = captureServer();
        const secrets = [
            "private-action-token",
            "private-query-token",
            "private-cookie",
            "person@example.invalid",
            "203.0.113.7",
        ];
        capture.server.post("/action/:token", () =>
            Promise.resolve({ ok: true }),
        );
        try {
            const result = await capture.server.inject({
                method: "POST",
                url: "/action/private-action-token?code=private-query-token",
                remoteAddress: "127.0.0.1",
                headers: {
                    "x-forwarded-for": "203.0.113.7",
                    cookie: "session=private-cookie",
                },
                payload: { email: "person@example.invalid" },
            });
            expect(result.statusCode).toBe(200);
            for (const secret of secrets)
                expect(capture.lines.join("")).not.toContain(secret);
            expect(capture.records()).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        msg: "incoming request",
                        req: { method: "POST", route: "/action/:token" },
                    }),
                    expect.objectContaining({
                        msg: "request completed",
                        res: { statusCode: 200 },
                    }),
                ]),
            );
        } finally {
            await capture.server.close();
        }
    });

    it("does not fall back to raw URLs on unmatched requests or forged request objects", async () => {
        const capture = captureServer();
        try {
            await capture.server.inject({
                method: "GET",
                url: "/private-action-token?secret=private-query-token",
            });
            capture.server.log.info({
                req: {
                    method: "GET",
                    routeOptions: { url: "/private-query-token" },
                },
            });
            expect(capture.lines.join("")).not.toContain(
                "private-action-token",
            );
            expect(capture.lines.join("")).not.toContain("private-query-token");
            expect(capture.records().at(0)).toMatchObject({
                req: { route: "[unmatched]" },
            });
        } finally {
            await capture.server.close();
        }
    });

    it("sanitizes Fastify automatic errors and typed application events", async () => {
        const capture = captureServer();
        capture.server.post("/failure", () => {
            throw new Error("Private statement person@example.invalid");
        });
        try {
            await capture.server.inject({ method: "POST", url: "/failure" });
            const providerError = new AxiosError(
                "private-provider-body",
                "ERR_BAD_RESPONSE",
                {
                    data: JSON.stringify({ email: "person@example.invalid" }),
                    headers: new AxiosHeaders({
                        authorization: "Bearer private-provider-body",
                    }),
                },
            );
            logApiError({
                logger: capture.server.log,
                level: "warn",
                event: {
                    event: "email_deliverability_check_failed",
                    provider: "reacher",
                },
                error: providerError,
            });
            expect(capture.lines.join("")).not.toContain(
                "person@example.invalid",
            );
            expect(capture.lines.join("")).not.toContain("Private statement");
            expect(capture.lines.join("")).not.toContain(
                "private-provider-body",
            );
            expect(capture.records()).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        event: "email_deliverability_check_failed",
                        provider: "reacher",
                        msg: "Email deliverability check failed",
                    }),
                ]),
            );
        } finally {
            await capture.server.close();
        }
    });

    it("preserves schema-projected load-test events and removes extra metadata", async () => {
        const capture = captureServer();
        try {
            capture.server.log.info(
                "AGORA_LOAD_EVENT %s",
                JSON.stringify({
                    schemaVersion: 1,
                    timestamp: "2026-10-09T00:00:00.000Z",
                    scenario: "solidago-ranking",
                    phase: "api",
                    action: "request_completed",
                    outcome: "success",
                    conversationSlugId: "convo001",
                    responseTimeMs: 42,
                    metadata: {
                        requestId: "req-1",
                        operation: "save",
                        transaction: 20,
                        email: "person@example.invalid",
                        token: "private-token",
                    },
                }),
            );
            expect(capture.lines.join("")).toContain("AGORA_LOAD_EVENT");
            expect(capture.lines.join("")).toContain("request_completed");
            expect(capture.lines.join("")).not.toContain(
                "person@example.invalid",
            );
            expect(capture.lines.join("")).not.toContain("private-token");
            capture.server.log.info(
                "AGORA_LOAD_EVENT %s",
                "{broken private-token",
            );
            expect(capture.records().at(1)).toMatchObject({
                msg: "Application event",
            });
        } finally {
            await capture.server.close();
        }
    });
});
