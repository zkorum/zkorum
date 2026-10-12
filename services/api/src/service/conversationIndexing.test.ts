import fastifySwagger from "@fastify/swagger";
import Fastify, { type FastifyInstance } from "fastify";
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    registerConversationIndexingRoute,
    type ConversationIndexingRequest,
} from "./conversationIndexing.js";

describe("conversation indexing route", () => {
    let server: FastifyInstance;
    const isIndexable =
        vi.fn<(request: ConversationIndexingRequest) => Promise<boolean>>();

    beforeEach(async () => {
        isIndexable.mockReset();
        server = Fastify({ logger: false });
        server.setValidatorCompiler(validatorCompiler);
        server.setSerializerCompiler(serializerCompiler);
        await server.register(fastifySwagger, {
            openapi: {
                info: { title: "Indexing test", version: "1.0.0" },
                components: {
                    securitySchemes: {
                        BearerAuth: { type: "http", scheme: "bearer" },
                    },
                },
                security: [{ BearerAuth: [] }],
            },
            transform: jsonSchemaTransform,
        });
        registerConversationIndexingRoute({
            server,
            apiVersion: "v1",
            isIndexable,
        });
    });

    afterEach(async () => {
        await server.close();
    });

    it("advertises anonymous access despite the global authentication default", async () => {
        await server.ready();
        const operation =
            server.swagger().paths?.["/api/v1/conversation/indexing"]?.post;
        expect(operation?.security).toEqual([]);
    });

    it.each([true, false])(
        "returns the explicit indexing policy %s without caching",
        async (isIndexed) => {
            isIndexable.mockResolvedValue(isIndexed);
            const response = await server.inject({
                method: "POST",
                url: "/api/v1/conversation/indexing",
                payload: { conversationSlugId: "conv1234" },
            });
            expect(response.statusCode).toBe(200);
            expect(response.headers["cache-control"]).toBe("no-store");
            expect(response.headers["x-robots-tag"]).toBe("noindex, nofollow");
            expect(response.headers["x-conversation-indexing"]).toBe(
                isIndexed ? "index" : "noindex",
            );
            expect(response.json<unknown>()).toEqual({ isIndexed });
            expect(isIndexable).toHaveBeenCalledExactlyOnceWith({
                conversationSlugId: "conv1234",
            });
        },
    );

    it("never permits indexing after a lookup failure", async () => {
        isIndexable.mockRejectedValue(new Error("Database unavailable"));
        const response = await server.inject({
            method: "POST",
            url: "/api/v1/conversation/indexing",
            payload: { conversationSlugId: "conv1234" },
        });
        expect(response.statusCode).toBe(500);
        expect(response.headers["x-conversation-indexing"]).toBeUndefined();
    });

    it("rejects oversized bodies before querying the database", async () => {
        const response = await server.inject({
            method: "POST",
            url: "/api/v1/conversation/indexing",
            payload: {
                conversationSlugId: "conv1234",
                extra: "x".repeat(1024),
            },
        });
        expect(response.statusCode).toBe(413);
        expect(isIndexable).not.toHaveBeenCalled();
        expect(response.headers["x-conversation-indexing"]).toBeUndefined();
    });

    it("rejects unexpected fields instead of silently discarding them", async () => {
        const response = await server.inject({
            method: "POST",
            url: "/api/v1/conversation/indexing",
            payload: { conversationSlugId: "conv1234", isIndexed: true },
        });
        expect(response.statusCode).toBe(400);
        expect(isIndexable).not.toHaveBeenCalled();
    });

    it.each(["", "invalid/slug", "too-long-slug", 'bad"slug'])(
        "rejects malformed slugs: %s",
        async (conversationSlugId) => {
            const response = await server.inject({
                method: "POST",
                url: "/api/v1/conversation/indexing",
                payload: { conversationSlugId },
            });
            expect(response.statusCode).toBe(400);
            expect(isIndexable).not.toHaveBeenCalled();
            expect(response.headers["x-conversation-indexing"]).toBeUndefined();
        },
    );
});
