import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Decoder, GlideClient, TimeoutError } from "@valkey/valkey-glide";
import { GenericContainer } from "testcontainers";
import { expect, vi } from "vitest";
import { z } from "zod";
import type { createVoteBuffer } from "../src/service/voteBuffer.js";
import {
    conversationTable,
    opinionTable,
    voteContentTable,
    voteTable,
} from "../src/shared-backend/schema.js";
import { VALKEY_QUEUE_KEYS } from "../src/shared-backend/valkeyQueues.js";

interface VoteReadCaseParams {
    db: PostgresJsDatabase;
    opinionId: number;
    opinionContentId: number;
    conversationId: number;
    authorId: string;
    createBuffer: typeof createVoteBuffer;
}

export async function assertVoteReadSerialization({
    db,
    opinionId,
    opinionContentId,
    conversationId,
    authorId,
    createBuffer,
}: VoteReadCaseParams): Promise<void> {
    const cacheContainer = await new GenericContainer("valkey/valkey:8-alpine")
        .withExposedPorts(6379)
        .start();
    const valkey = await GlideClient.createClient({
        addresses: [
            {
                host: cacheContainer.getHost(),
                port: cacheContainer.getMappedPort(6379),
            },
        ],
        defaultDecoder: Decoder.String,
    });
    const buffer = createBuffer({
        db,
        valkeyRef: { current: valkey },
        flushIntervalMs: 60_000,
        valkeyBatchLimit: 100,
    });
    const vote = {
        userId: authorId,
        opinionId,
        opinionContentId,
        conversationId,
        timestamp: new Date(),
    };
    let releaseRead: (() => void) | undefined;
    const release = new Promise<void>((resolve) => {
        releaseRead = resolve;
    });
    const originalHmget = valkey.hmget.bind(valkey);
    const recheck = vi
        .spyOn(valkey, "hmget")
        .mockImplementationOnce(async (...args) => {
            const captured = await originalHmget(...args);
            await release;
            return captured;
        });
    let observation: NodeJS.Timeout | undefined;
    let flushing: Promise<void> | undefined;
    try {
        await buffer.add({ vote: { ...vote, vote: "agree" } });
        flushing = buffer.flush();
        const activeFlush = flushing;
        expect(buffer.flush()).toBe(flushing);
        // The observation deadline must not cancel or unblock the writer.
        const result = await Promise.race([
            (async () => {
                try {
                    await activeFlush;
                    return { status: "resolved" };
                } catch (error) {
                    return { status: "rejected", error };
                }
            })(),
            new Promise<{ status: "pending" }>((resolve) => {
                observation = setTimeout(() => {
                    resolve({ status: "pending" });
                }, 1000);
                observation.unref();
            }),
        ]);
        expect(recheck).toHaveBeenCalledTimes(1);
        expect(await valkey.hlen(VALKEY_QUEUE_KEYS.VOTE_BUFFER_DATA)).toBe(1);
        expect(
            await db
                .select()
                .from(voteTable)
                .where(eq(voteTable.opinionId, opinionId)),
        ).toEqual([]);
        expect(result).toEqual({ status: "pending" });

        // A warning or elapsed observation deadline must never release the
        // writer guard while its transaction can still commit.
        await buffer.add({ vote: { ...vote, vote: "disagree" } });
        expect(buffer.flush()).toBe(flushing);
        releaseRead?.();
        await flushing;
        await vi.waitFor(() => {
            expect(recheck.mock.settledResults.at(0)?.type).toBe("fulfilled");
        });
        // The older flush may commit its captured choice, but its cleanup
        // must retain the newer payload for the next serialized flush.
        expect(await valkey.hlen(VALKEY_QUEUE_KEYS.VOTE_BUFFER_DATA)).toBe(1);
        await buffer.flush();
        expect(
            await db
                .select({ choice: voteContentTable.vote })
                .from(voteTable)
                .innerJoin(
                    voteContentTable,
                    eq(voteContentTable.id, voteTable.currentContentId),
                )
                .where(eq(voteTable.opinionId, opinionId)),
        ).toEqual([{ choice: "disagree" }]);
        expect(
            await db
                .select({
                    agrees: opinionTable.numAgrees,
                    disagrees: opinionTable.numDisagrees,
                })
                .from(opinionTable)
                .where(eq(opinionTable.id, opinionId)),
        ).toEqual([{ agrees: 0, disagrees: 1 }]);
        expect(
            await db
                .select()
                .from(voteContentTable)
                .where(eq(voteContentTable.opinionContentId, opinionContentId)),
        ).toHaveLength(2);
        expect(await valkey.hlen(VALKEY_QUEUE_KEYS.VOTE_BUFFER_DATA)).toBe(0);
    } finally {
        if (observation !== undefined) clearTimeout(observation);
        releaseRead?.();
        try {
            await flushing;
        } finally {
            recheck.mockRestore();
            try {
                await buffer.shutdown();
            } finally {
                valkey.close();
                await cacheContainer.stop();
            }
        }
    }
}

export async function assertNativeValkeyTimeoutRecovery({
    db,
    opinionId,
    opinionContentId,
    conversationId,
    authorId,
    createBuffer,
}: VoteReadCaseParams): Promise<void> {
    const cacheContainer = await new GenericContainer("valkey/valkey:8-alpine")
        .withExposedPorts(6379)
        .start();
    const addresses = [
        {
            host: cacheContainer.getHost(),
            port: cacheContainer.getMappedPort(6379),
        },
    ];
    const valkey = await GlideClient.createClient({
        addresses,
        defaultDecoder: Decoder.String,
        requestTimeout: 100,
    });
    const control = await GlideClient.createClient({
        addresses,
        defaultDecoder: Decoder.String,
        requestTimeout: 2000,
    });
    const buffer = createBuffer({
        db,
        valkeyRef: { current: valkey },
        flushIntervalMs: 60_000,
        valkeyBatchLimit: 100,
    });
    let releaseLock: () => void = () => undefined;
    let reportLocked: () => void = () => undefined;
    const release = new Promise<void>((resolve) => {
        releaseLock = resolve;
    });
    const locked = new Promise<void>((resolve) => {
        reportLocked = resolve;
    });
    let blocker: Promise<void> | undefined;
    try {
        await buffer.add({
            vote: {
                userId: authorId,
                opinionId,
                opinionContentId,
                conversationId,
                timestamp: new Date(),
                vote: "agree",
            },
        });
        blocker = db.transaction(async (tx) => {
            await tx
                .select({ id: conversationTable.id })
                .from(conversationTable)
                .where(eq(conversationTable.id, conversationId))
                .for("no key update");
            reportLocked();
            await release;
        });
        await locked;
        const flushing = buffer.flush();
        const rejection = expect(flushing).rejects.toBeInstanceOf(TimeoutError);
        // Synchronize on the real database lock wait: the initial queue read
        // has finished, but the in-transaction HMGET has not been sent yet.
        await vi.waitFor(async () => {
            const counts = z.array(z.object({ count: z.number() })).parse(
                await db.execute(sql`
                SELECT count(*)::integer AS count FROM pg_stat_activity
                WHERE datname = current_database() AND wait_event_type = 'Lock'
                  AND query LIKE 'select%from "conversation"%for no key update'
            `),
            );
            expect(counts.some((row) => row.count > 0)).toBe(true);
        });
        await control.customCommand(["CLIENT", "PAUSE", "500", "ALL"]);
        releaseLock();
        await blocker;
        await rejection;
        // This command completes when the pause ends, without a guessed sleep.
        await control.ping();
        expect(await valkey.hlen(VALKEY_QUEUE_KEYS.VOTE_BUFFER_DATA)).toBe(1);
        expect(
            await db
                .select()
                .from(voteTable)
                .where(eq(voteTable.opinionId, opinionId)),
        ).toEqual([]);
        await buffer.flush();
        expect(
            await db
                .select({ agrees: opinionTable.numAgrees })
                .from(opinionTable)
                .where(eq(opinionTable.id, opinionId)),
        ).toEqual([{ agrees: 1 }]);
        expect(await valkey.hlen(VALKEY_QUEUE_KEYS.VOTE_BUFFER_DATA)).toBe(0);
    } finally {
        releaseLock();
        try {
            await blocker;
        } finally {
            try {
                await buffer.shutdown();
            } finally {
                valkey.close();
                control.close();
                await cacheContainer.stop();
            }
        }
    }
}

export async function assertValkeyStallSessionState({
    db,
    opinionId,
    opinionContentId,
    conversationId,
    authorId,
    createBuffer,
}: VoteReadCaseParams): Promise<void> {
    const cacheContainer = await new GenericContainer("valkey/valkey:8-alpine")
        .withExposedPorts(6379)
        .start();
    const valkey = await GlideClient.createClient({
        addresses: [
            {
                host: cacheContainer.getHost(),
                port: cacheContainer.getMappedPort(6379),
            },
        ],
        defaultDecoder: Decoder.String,
    });
    const buffer = createBuffer({
        db,
        valkeyRef: { current: valkey },
        flushIntervalMs: 60_000,
        valkeyBatchLimit: 100,
    });
    let releaseRead: () => void = () => undefined;
    let reportRead: () => void = () => undefined;
    const release = new Promise<void>((resolve) => {
        releaseRead = resolve;
    });
    const reachedRead = new Promise<void>((resolve) => {
        reportRead = resolve;
    });
    const originalHmget = valkey.hmget.bind(valkey);
    const recheck = vi
        .spyOn(valkey, "hmget")
        .mockImplementationOnce(async (...args) => {
            const captured = await originalHmget(...args);
            reportRead();
            await release;
            return captured;
        });
    let flushing: Promise<void> | undefined;
    try {
        await buffer.add({
            vote: {
                userId: authorId,
                opinionId,
                opinionContentId,
                conversationId,
                timestamp: new Date(),
                vote: "agree",
            },
        });
        flushing = buffer.flush();
        await reachedRead;
        const sessions = z
            .array(
                z.object({
                    state: z.string(),
                    wait_event_type: z.string().nullable(),
                    wait_event: z.string().nullable(),
                }),
            )
            .parse(
                await db.execute(sql`
            SELECT state, wait_event_type, wait_event FROM pg_stat_activity
            WHERE datname = current_database() AND pid <> pg_backend_pid()
              AND xact_start IS NOT NULL
              AND query LIKE 'select%from "conversation"%for no key update'
        `),
            );
        expect(sessions).toHaveLength(1);
        expect(sessions).toEqual([
            expect.objectContaining({
                state: "idle in transaction",
                wait_event_type: "Client",
                wait_event: "ClientRead",
            }),
        ]);
    } finally {
        releaseRead();
        try {
            await flushing;
        } finally {
            recheck.mockRestore();
            try {
                await buffer.shutdown();
            } finally {
                valkey.close();
                await cacheContainer.stop();
            }
        }
    }
}
