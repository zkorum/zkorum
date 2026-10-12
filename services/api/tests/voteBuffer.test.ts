import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { Decoder, GlideClient, Script } from "@valkey/valkey-glide";
import { z } from "zod";
import {
    ADD_VOTE_SCRIPT,
    CLEANUP_VOTES_SCRIPT,
} from "../src/service/voteBuffer.js";

describe("Vote buffer atomic queue and statement lookup", () => {
    let container: StartedTestContainer;
    let client: GlideClient;
    let addScript: Script;
    let cleanupScript: Script;
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
    }, 60_000);
    afterAll(async () => {
        addScript.release();
        cleanupScript.release();
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
