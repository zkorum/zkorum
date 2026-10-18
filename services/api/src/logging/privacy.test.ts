import Fastify from "fastify";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApiLogPrivacy, logApiError } from "./privacy.js";
import { logSeedSuggestionEvent } from "../service/seedSuggestion.js";

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
    it("emits actionable startup failures with redacted Node stack traces", async () => {
        const capture = captureServer();
        const error = Object.assign(
            new Error(
                "listen EADDRINUSE: address already in use 192.0.2.1:8084",
            ),
            { code: "EADDRINUSE" },
        );
        error.stack = `${error.message}\n    at Server.setupListenHandle (node:net:1940:16)\n    at listenInCluster (node:net:1997:12)`;
        try {
            logApiError({
                logger: capture.server.log,
                level: "error",
                event: { event: "server_start_failed" },
                error,
            });
            expect(capture.records().at(0)).toMatchObject({
                event: "server_start_failed",
                msg: "API server failed to start",
                err: {
                    code: "EADDRINUSE",
                    message: "Address is already in use",
                    stack: "Error [EADDRINUSE]: Address is already in use\n    at node:net:1940:16\n    at node:net:1997:12",
                },
            });
            expect(capture.lines.join("")).not.toContain("192.0.2.1");
        } finally {
            await capture.server.close();
        }
    });
    it("keeps approved Bedrock diagnostics while omitting provider text and metadata", async () => {
        const capture = captureServer();
        const error = new Error("private-provider-message private-credential");
        error.name = "AccessDeniedException";
        Object.assign(error, {
            $metadata: {
                httpStatusCode: 403,
                requestId: "private-provider-request-id",
            },
        });
        try {
            logApiError({
                logger: capture.server.log,
                level: "warn",
                event: { event: "application_error" },
                error,
            });
            expect(capture.records().at(0)).toMatchObject({
                err: {
                    type: "AccessDeniedException",
                    statusCode: 403,
                    message: "Error details omitted",
                },
            });
            for (const secret of [
                "private-provider-message",
                "private-credential",
                "private-provider-request-id",
            ])
                expect(capture.lines.join("")).not.toContain(secret);
        } finally {
            await capture.server.close();
        }
    });
    it("retains seed-suggestion analytics without provider messages or draft text", async () => {
        const capture = captureServer();
        const userId = crypto.randomUUID();
        const draftId = crypto.randomUUID();
        try {
            logSeedSuggestionEvent({
                logger: capture.server.log,
                event: {
                    event: "failed",
                    userId,
                    draftId,
                    conversationType: "polis",
                    source: "bedrock",
                    durationMs: 15,
                    reason: "model_failure",
                },
            });
            capture.server.log.info(
                {
                    event: "seed_suggestion",
                    seedSuggestion: {
                        event: "added",
                        userId,
                        draftId,
                        generationId: crypto.randomUUID(),
                        suggestionId: crypto.randomUUID(),
                        detail: "private-provider-error",
                        title: "private-draft-title",
                        model: "private-model-text",
                    },
                },
                "AGORA_AI_SUGGESTION_EVENT",
            );
            expect(capture.records().at(0)).toMatchObject({
                msg: "AGORA_AI_SUGGESTION_EVENT",
                event: "seed_suggestion_failed",
                seedSuggestion: { draftId, reason: "model_failure" },
            });
            expect(capture.records().at(1)).toMatchObject({
                event: "seed_suggestion",
                seedSuggestion: { event: "added", userId },
            });
            for (const secret of [
                "private-provider-error",
                "private-draft-title",
                "private-model-text",
            ])
                expect(capture.lines.join("")).not.toContain(secret);
        } finally {
            await capture.server.close();
        }
    });
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
