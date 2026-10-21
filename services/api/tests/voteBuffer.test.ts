import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import {
    Decoder,
    GlideClient,
    RequestError,
    Script,
    TimeoutError,
} from "@valkey/valkey-glide";
import { z } from "zod";
import {
    ADD_VOTE_SCRIPT,
    CLEANUP_VOTES_SCRIPT,
    READ_VOTES_SCRIPT,
} from "../src/service/voteBuffer.js";

describe("Vote buffer atomic queue and statement lookup", () => {
    let container: StartedTestContainer;
    let client: GlideClient;
    let addScript: Script;
    let cleanupScript: Script;
    let readScript: Script;
    const indexKey = "test:votes:index";
    const dataKey = "test:votes:data";
    const opinionPrefix = "test:votes:opinion:";
    const keys = [indexKey, dataKey, opinionPrefix];

    beforeAll(async () => {
        container = await new GenericContainer("valkey/valkey:8")
            .withExposedPorts(6379)
            .start();
        client = await GlideClient.createClient({
            addresses: [
                {
                    host: container.getHost(),
                    port: container.getMappedPort(6379),
                },
            ],
            defaultDecoder: Decoder.String,
        });
        addScript = new Script(ADD_VOTE_SCRIPT);
        cleanupScript = new Script(CLEANUP_VOTES_SCRIPT);
        readScript = new Script(READ_VOTES_SCRIPT);
    }, 60_000);
    afterAll(async () => {
        addScript.release();
        cleanupScript.release();
        readScript.release();
        client.close();
        await container.stop();
    });
    beforeEach(async () => {
        await client.flushall();
    });

    async function add({
        member = "user1:1",
        timestamp = 1000,
        data = "voteA",
    }: {
        member?: string;
        timestamp?: number;
        data?: string;
    } = {}) {
        return await client.invokeScript(addScript, {
            keys,
            args: [member, String(timestamp), data],
        });
    }
    async function cleanup(entries: { member: string; data: string }[]) {
        return await client.invokeScript(cleanupScript, {
            keys,
            args: entries.flatMap(({ member, data }) => [member, data]),
        });
    }
    async function read(limit: number) {
        return z.array(z.tuple([z.string(), z.string()])).parse(
            await client.invokeScript(readScript, {
                keys: [indexKey, dataKey],
                args: [String(limit)],
            }),
        );
    }

    it("reads an empty queue without changing its structures", async () => {
        expect(await read(10)).toEqual([]);
        expect(await client.zcard(indexKey)).toBe(0);
        expect(await client.hlen(dataKey)).toBe(0);
    });

    it("reads a bounded timestamp-ordered batch without consuming votes", async () => {
        await add({ member: "user3:3", timestamp: 3000, data: "third" });
        await add({ member: "user1:1", timestamp: 1000, data: "first" });
        await add({ member: "user2:2", timestamp: 2000, data: "second" });

        const expected = [
            ["user1:1", "first"],
            ["user2:2", "second"],
        ];
        expect(await read(2)).toEqual(expected);
        expect(await read(2)).toEqual(expected);
        expect(await client.zcard(indexKey)).toBe(3);
        expect(await client.hlen(dataKey)).toBe(3);
    });

    it("preserves a same-timestamp replacement after reading an older payload", async () => {
        const timestamp = 1792528027000;
        await add({ timestamp, data: "agree" });
        const captured = await read(1);
        expect(captured).toEqual([["user1:1", "agree"]]);

        await add({ timestamp, data: "cancel" });
        expect(
            await cleanup(captured.map(([member, data]) => ({ member, data }))),
        ).toBe(0);
        expect(await read(1)).toEqual([["user1:1", "cancel"]]);
        expect(await cleanup([{ member: "user1:1", data: "cancel" }])).toBe(1);
        expect(await read(1)).toEqual([]);
    });

    it("returns exact payload bytes for conditional cleanup", async () => {
        const data = JSON.stringify({
            userId: "user1",
            opinionId: 1,
            vote: "agree",
            timestamp: "2026-10-20T20:27:07.000Z",
            content: "Égalité שלום مرحبا 中文 ".repeat(1000),
        });
        await add({ timestamp: 1792528027000, data });
        expect(await read(1)).toEqual([["user1:1", data]]);
        expect(await cleanup([{ member: "user1:1", data }])).toBe(1);
        expect(await read(1)).toEqual([]);
    });

    it("reloads reusable scripts after the server script cache is cleared", async () => {
        await add();
        expect(await read(1)).toEqual([["user1:1", "voteA"]]);
        await client.scriptFlush();
        expect(await read(1)).toEqual([["user1:1", "voteA"]]);
        expect(await cleanup([{ member: "user1:1", data: "voteA" }])).toBe(1);
        await client.scriptFlush();
        expect(await add()).toBe(1);
        expect(await read(1)).toEqual([["user1:1", "voteA"]]);
    });

    it("does not wait for a future timestamp before returning a queued vote", async () => {
        const timestamp = 8_000_000_000_000;
        await add({ timestamp, data: "future-vote" });
        expect(await read(1)).toEqual([["user1:1", "future-vote"]]);
        expect(await client.zscore(indexKey, "user1:1")).toBe(timestamp);
    });

    it("completes concurrent read-script cache misses", async () => {
        await add();
        await client.scriptFlush();
        const batches = await Promise.all(
            Array.from({ length: 50 }, () => read(1)),
        );
        for (const batch of batches)
            expect(batch).toEqual([["user1:1", "voteA"]]);
        expect(await cleanup([{ member: "user1:1", data: "voteA" }])).toBe(1);
    });

    it("defers Lua syntax checking until server loading and returns a rejection", async () => {
        const malformed = new Script("return {");
        try {
            await expect(client.invokeScript(malformed)).rejects.toBeInstanceOf(
                RequestError,
            );
            expect(await client.ping()).toBe("PONG");
        } finally {
            malformed.release();
        }
    });

    it.each([
        { name: "add", key: indexKey, invoke: () => add() },
        { name: "read", key: indexKey, invoke: () => read(1) },
        {
            name: "cleanup",
            key: dataKey,
            invoke: () => cleanup([{ member: "user1:1", data: "voteA" }]),
        },
    ])(
        "rejects a wrong-type key in $name without hanging",
        async ({ key, invoke }) => {
            await client.set(key, "wrong-type");
            await expect(invoke()).rejects.toBeInstanceOf(RequestError);
            expect(await client.ping()).toBe("PONG");
        },
    );

    it("exposes partial writes when the final add-script command fails", async () => {
        await client.set(`${opinionPrefix}1`, "wrong-type");
        await expect(add()).rejects.toBeInstanceOf(RequestError);
        // Lua is atomic with respect to other clients, but errors do not roll
        // back earlier commands. These entries remain available for flushing.
        expect(await client.zscore(indexKey, "user1:1")).toBe(1000);
        expect(await read(1)).toEqual([["user1:1", "voteA"]]);
    });

    it("demonstrates orphaned-head starvation separately from a pending script", async () => {
        await client.zadd(indexKey, [{ element: "orphan:1", score: 0 }]);
        await add({ timestamp: 1000 });
        expect(await read(1)).toEqual([]);
        expect(await read(1)).toEqual([]);
        expect(await read(2)).toEqual([["user1:1", "voteA"]]);
        expect(await client.ping()).toBe("PONG");
    });

    it("times out an executing Lua loop while the server reports BUSY to other commands", async () => {
        const impatient = await GlideClient.createClient({
            addresses: [
                {
                    host: container.getHost(),
                    port: container.getMappedPort(6379),
                },
            ],
            requestTimeout: 100,
        });
        const endless = new Script("while true do end");
        await client.customCommand(["CONFIG", "SET", "lua-time-limit", "50"]);
        try {
            await expect(
                impatient.invokeScript(endless),
            ).rejects.toBeInstanceOf(TimeoutError);
            await expect(client.ping()).rejects.toBeInstanceOf(RequestError);
        } finally {
            try {
                await client.scriptKill();
                await client.customCommand([
                    "CONFIG",
                    "SET",
                    "lua-time-limit",
                    "5000",
                ]);
            } finally {
                endless.release();
                impatient.close();
            }
        }
        expect(await client.ping()).toBe("PONG");
    });

    it("publishes the queue and per-statement lookup together", async () => {
        expect(await add()).toBe(1);
        expect(await client.zscore(indexKey, "user1:1")).toBe(1000);
        expect(await client.hget(dataKey, "user1:1")).toBe("voteA");
        expect(await client.hget(`${opinionPrefix}1`, "user1:1")).toBe("voteA");
    });

    it.each([
        { timestamp: 999, accepted: false },
        { timestamp: 1000, accepted: true },
        { timestamp: 1001, accepted: true },
    ])(
        "orders replacement actions at timestamp $timestamp",
        async ({ timestamp, accepted }) => {
            await add();
            expect(await add({ timestamp, data: "cancel" })).toBe(
                accepted ? 1 : 0,
            );
            const expected = accepted ? "cancel" : "voteA";
            expect(await client.hget(dataKey, "user1:1")).toBe(expected);
            expect(await client.hget(`${opinionPrefix}1`, "user1:1")).toBe(
                expected,
            );
            expect(await client.zscore(indexKey, "user1:1")).toBe(
                accepted ? timestamp : 1000,
            );
        },
    );

    it.each([
        { member: "did:web:example.com%3A8080:1", opinionId: 1 },
        { member: "user1:0", opinionId: 0 },
    ])(
        "indexes the trailing opinion ID in $member",
        async ({ member, opinionId }) => {
            await add({ member });
            expect(
                await client.hget(
                    `${opinionPrefix}${String(opinionId)}`,
                    member,
                ),
            ).toBe("voteA");
        },
    );

    it("preserves large payloads and millisecond timestamp precision", async () => {
        const data = JSON.stringify({ proof: "a".repeat(10_000) });
        await add({ timestamp: 1704067200123, data });
        expect(await client.zscore(indexKey, "user1:1")).toBe(1704067200123);
        expect(await client.hget(dataKey, "user1:1")).toBe(data);
        expect(await cleanup([{ member: "user1:1", data }])).toBe(1);
    });

    it("removes a persisted payload from all three structures", async () => {
        await add();
        expect(await cleanup([{ member: "user1:1", data: "voteA" }])).toBe(1);
        expect(await client.zscore(indexKey, "user1:1")).toBeNull();
        expect(await client.hget(dataKey, "user1:1")).toBeNull();
        expect(await client.hget(`${opinionPrefix}1`, "user1:1")).toBeNull();
    });

    it.each([1000, 2000])(
        "preserves a later cancellation at timestamp %s during cleanup",
        async (timestamp) => {
            await add();
            const persistedData = z
                .string()
                .parse(await client.hget(dataKey, "user1:1"));
            await add({ timestamp, data: "cancel" });
            expect(
                await cleanup([{ member: "user1:1", data: persistedData }]),
            ).toBe(0);
            expect(await client.hget(dataKey, "user1:1")).toBe("cancel");
            expect(await client.hget(`${opinionPrefix}1`, "user1:1")).toBe(
                "cancel",
            );
        },
    );

    it("cleans a batch without removing replaced actions", async () => {
        const entries = Array.from({ length: 100 }, (_, index) => ({
            member: `user${String(index)}:${String(index)}`,
            data: `vote${String(index)}`,
        }));
        for (const entry of entries) await add(entry);
        await add({ member: "user2:2", data: "cancel" });
        expect(await cleanup(entries)).toBe(99);
        expect(await client.zcard(indexKey)).toBe(1);
        expect(await client.hlen(dataKey)).toBe(1);
        expect(await client.hget(`${opinionPrefix}2`, "user2:2")).toBe(
            "cancel",
        );
        expect(await client.hget(`${opinionPrefix}3`, "user3:3")).toBeNull();
    });

    it("handles empty and already-cleaned batches", async () => {
        expect(await cleanup([])).toBe(0);
        const entries = [{ member: "user1:1", data: "voteA" }];
        expect(await cleanup(entries)).toBe(0);
        await add();
        expect(await cleanup(entries)).toBe(1);
        expect(await cleanup(entries)).toBe(0);
    });

    it("does not delete an orphaned index without a matching payload", async () => {
        await client.zadd(indexKey, [{ element: "user1:1", score: 1000 }]);
        expect(await cleanup([{ member: "user1:1", data: "voteA" }])).toBe(0);
        expect(await client.zscore(indexKey, "user1:1")).toBe(1000);
    });

    it("keeps the last rapid vote/cancel/vote action", async () => {
        await add({ data: "agree" });
        await add({ data: "cancel" });
        await add({ data: "disagree" });
        expect(await client.hget(dataKey, "user1:1")).toBe("disagree");
        expect(await client.hget(`${opinionPrefix}1`, "user1:1")).toBe(
            "disagree",
        );
    });

    it("retrieves a bounded batch in timestamp order", async () => {
        await add({ member: "user3:3", timestamp: 3000 });
        await add({ member: "user1:1", timestamp: 1000 });
        await add({ member: "user2:2", timestamp: 2000 });
        expect(await client.zrange(indexKey, { start: 0, end: 1 })).toEqual([
            "user1:1",
            "user2:2",
        ]);
        expect(
            await client.zrangeWithScores(indexKey, { start: 0, end: -1 }),
        ).toEqual([
            { element: "user1:1", score: 1000 },
            { element: "user2:2", score: 2000 },
            { element: "user3:3", score: 3000 },
        ]);
    });
});
