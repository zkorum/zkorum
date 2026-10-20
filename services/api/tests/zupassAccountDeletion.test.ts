import { eq } from "drizzle-orm";
import { withReplicas } from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { GenericContainer, type StartedTestContainer } from "testcontainers";

import { readDbFixtureSql } from "./dbFixture.js";

process.env.NODE_ENV = "test";
process.env.CORS_ORIGIN_LIST = "http://localhost:9000";
process.env.PEPPERS = Buffer.from("0123456789abcdef0123456789abcdef").toString(
    "base64",
);
process.env.VERIFICATOR_SVC_BASE_URL = "http://localhost:3000";

vi.mock("@pcd/gpc", () => ({
    boundConfigFromJSON: (value: unknown) => value,
    revealedClaimsFromJSON: (value: unknown) => value,
    gpcVerify: () => Promise.resolve(true),
}));

const { verifyEventTicket, hasEventTicket } =
    await import("../src/service/zupass.js");
const { log } = await import("../src/app.js");
const schema = await import("../src/shared-backend/schema.js");

const {
    deviceTable,
    eventTicketTable,
    userDisplayLanguageTable,
    userSpokenLanguagesTable,
    userTable,
} = schema;

const EVENT_SLUG = "devconnect-2025";
const EVENT_ID = "1f36ddce-e538-4c7a-9f31-6a4b2221ecac";
const SIGNER_PUBLIC_KEY = "YwahfUdUYehkGMaWh0+q3F8itx2h8mybjPmt8CmTJSs";
const NOW = new Date("2026-08-03T00:00:00.000Z");
const SESSION_EXPIRY = new Date("2100-01-01T00:00:00.000Z");

function createLatch(): { promise: Promise<void>; release: () => void } {
    let resolver: (() => void) | undefined;
    const promise = new Promise<void>((resolve) => {
        resolver = resolve;
    });
    return {
        promise,
        release: () => {
            if (resolver === undefined) {
                throw new Error("Latch resolver was not initialized");
            }
            resolver();
        },
    };
}

function createProofData({
    didWrite,
    nullifierHash,
}: {
    didWrite: string;
    nullifierHash: bigint;
}): unknown {
    return {
        proof: {},
        boundConfig: {
            tuples: {
                ticket: { isMemberOf: "ticket-allowlist" },
            },
        },
        revealedClaims: {
            watermark: { type: "string", value: didWrite },
            membershipLists: {
                "ticket-allowlist": [
                    [
                        { type: "eddsa_pubkey", value: SIGNER_PUBLIC_KEY },
                        { type: "string", value: EVENT_ID },
                    ],
                ],
            },
            owner: {
                externalNullifier: {
                    type: "string",
                    value: `agora-${EVENT_SLUG}-v1`,
                },
                nullifierHashV4: nullifierHash,
            },
        },
    };
}

describe("Zupass account deletion serialization", () => {
    let container: StartedTestContainer;
    let authSql: postgres.Sql;
    let deletionSql: postgres.Sql;
    let observerSql: postgres.Sql;
    let db: PostgresJsDatabase;
    let authBackendPid: number;

    beforeAll(async () => {
        container = await new GenericContainer(
            process.env.AGORA_TEST_POSTGRES_IMAGE ?? "postgres:16-alpine",
        )
            .withEnvironment({
                POSTGRES_USER: "postgres",
                POSTGRES_PASSWORD: "postgres",
                POSTGRES_DB: "agora_test",
            })
            .withExposedPorts(5432)
            .start();

        const connection = {
            host: container.getHost(),
            port: container.getMappedPort(5432),
            database: "agora_test",
            username: "postgres",
            password: "postgres",
            max: 1,
        };
        authSql = postgres(connection);
        deletionSql = postgres(connection);
        observerSql = postgres(connection);
        db = drizzle(authSql);

        await observerSql.unsafe(readDbFixtureSql("zupass-auth.sql"));
        const backendRows = await authSql<{ pid: number }[]>`
            SELECT pg_backend_pid() AS pid
        `;
        const backend = backendRows.at(0);
        if (backend === undefined) {
            throw new Error("Failed to identify the Zupass test connection");
        }
        authBackendPid = backend.pid;
    }, 120000);

    afterAll(async () => {
        await authSql.end({ timeout: 5 });
        await deletionSql.end({ timeout: 5 });
        await observerSql.end({ timeout: 5 });
        await container.stop();
    }, 120000);

    beforeEach(async () => {
        await observerSql.unsafe(`
            TRUNCATE TABLE
                "user_spoken_languages",
                "user_display_language",
                "event_ticket",
                "zk_passport",
                "phone",
                "email",
                "device",
                "user"
            RESTART IDENTITY;
        `);
    });

    async function createUser({
        didWrite,
    }: {
        didWrite?: string;
    }): Promise<string> {
        const userId = crypto.randomUUID();
        await db.insert(userTable).values({
            id: userId,
            username: `user${userId.replaceAll("-", "").slice(0, 16)}`,
        });
        if (didWrite !== undefined) {
            await db.insert(deviceTable).values({
                didWrite,
                userId,
                userAgent: "test-agent",
                sessionExpiry: SESSION_EXPIRY,
            });
        }
        return userId;
    }

    async function addTicket({
        userId,
        nullifier,
    }: {
        userId: string;
        nullifier: string;
    }): Promise<void> {
        await db.insert(eventTicketTable).values({
            userId,
            provider: "zupass",
            nullifier,
            eventSlug: EVENT_SLUG,
            pcdType: "gpc",
        });
    }

    async function verifyTicket({
        didWrite,
        nullifierHash,
    }: {
        didWrite: string;
        nullifierHash: bigint;
    }) {
        return await verifyEventTicket({
            db,
            didWrite,
            proofData: createProofData({ didWrite, nullifierHash }),
            eventSlug: EVENT_SLUG,
            userAgent: "test-agent",
            now: NOW,
            sessionLifetimeDays: 90,
            currentDisplayLanguage: "en",
            afterVerified: () => Promise.resolve(undefined),
        });
    }

    it("returns its continuation from the ticket write transaction before commit", async () => {
        const didWrite = "did:test:zupass:continuation";
        const userId = await createUser({ didWrite });
        const selectReplica = vi.fn(() => db);
        const result = await verifyEventTicket({
            db: withReplicas(db, [db], selectReplica),
            didWrite,
            proofData: createProofData({ didWrite, nullifierHash: 17n }),
            eventSlug: EVENT_SLUG,
            userAgent: "test-agent",
            now: NOW,
            sessionLifetimeDays: 90,
            currentDisplayLanguage: "en",
            afterVerified: async ({ database, userId: verifiedUserId }) => {
                expect(verifiedUserId).toBe(userId);
                expect(
                    await hasEventTicket({
                        db: database,
                        userId,
                        eventSlug: EVENT_SLUG,
                    }),
                ).toBe(true);
                const notCommitted = await drizzle(observerSql)
                    .select({ id: eventTicketTable.id })
                    .from(eventTicketTable)
                    .where(eq(eventTicketTable.userId, userId));
                expect(notCommitted).toEqual([]);
                return { status: "ready" };
            },
        });
        expect(result).toMatchObject({
            success: true,
            userId,
            continuation: { status: "ready" },
        });
        expect(selectReplica).not.toHaveBeenCalled();
    });

    it("rolls ticket creation back if the required continuation fails", async () => {
        const didWrite = "did:test:zupass:continuation-rollback";
        const userId = await createUser({ didWrite });
        const failureLog = vi.spyOn(log, "error").mockImplementation(() => {});
        try {
            await expect(
                verifyEventTicket({
                    db,
                    didWrite,
                    proofData: createProofData({
                        didWrite,
                        nullifierHash: 18n,
                    }),
                    eventSlug: EVENT_SLUG,
                    userAgent: "test-agent",
                    now: NOW,
                    sessionLifetimeDays: 90,
                    currentDisplayLanguage: "en",
                    afterVerified: () =>
                        Promise.reject(new Error("Continuation unavailable")),
                }),
            ).rejects.toThrow("Continuation unavailable");
            expect(
                await hasEventTicket({ db, userId, eventSlug: EVENT_SLUG }),
            ).toBe(false);
            expect(failureLog).toHaveBeenCalledOnce();
        } finally {
            failureLog.mockRestore();
        }
    });

    it("does not accept a soft-deleted ticket belonging to an active user", async () => {
        const userId = await createUser({});
        await addTicket({ userId, nullifier: "0x19" });
        expect(
            await hasEventTicket({ db, userId, eventSlug: EVENT_SLUG }),
        ).toBe(true);
        await db
            .update(eventTicketTable)
            .set({ isDeleted: true })
            .where(eq(eventTicketTable.userId, userId));
        expect(
            await hasEventTicket({ db, userId, eventSlug: EVENT_SLUG }),
        ).toBe(false);
    });

    async function waitForAuthUserLock(): Promise<void> {
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
            const rows = await observerSql<{ waitEventType: string | null }[]>`
                SELECT wait_event_type AS "waitEventType"
                FROM pg_stat_activity
                WHERE pid = ${authBackendPid}
            `;
            if (rows.at(0)?.waitEventType === "Lock") {
                return;
            }
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 10);
            });
        }
        throw new Error("Zupass authentication did not wait for the user lock");
    }

    async function startPendingDeletion({
        userId,
    }: {
        userId: string;
    }): Promise<{ commit: () => Promise<void> }> {
        const started = createLatch();
        const allowCommit = createLatch();
        const completion = deletionSql.begin(async (tx) => {
            await tx`
                UPDATE "user"
                SET "is_deleted" = true, "deleted_at" = ${NOW}
                WHERE "id" = ${userId}
            `;
            await tx`
                UPDATE "event_ticket"
                SET "is_deleted" = true
                WHERE "user_id" = ${userId}
            `;
            await tx`
                UPDATE "device"
                SET "session_expiry" = ${NOW}
                WHERE "user_id" = ${userId}
            `;
            started.release();
            await allowCommit.promise;
        });
        await started.promise;
        return {
            commit: async () => {
                allowCommit.release();
                await completion;
            },
        };
    }

    it("allows genuine unknown-user registration", async () => {
        const didWrite = "did:test:zupass:new-user";

        const result = await verifyTicket({ didWrite, nullifierHash: 1n });

        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error("Expected Zupass registration to succeed");
        }
        const devices = await db
            .select({ userId: deviceTable.userId })
            .from(deviceTable)
            .where(eq(deviceTable.didWrite, didWrite));
        expect(devices).toEqual([{ userId: result.userId }]);
        expect(
            await db
                .select()
                .from(eventTicketTable)
                .where(eq(eventTicketTable.userId, result.userId)),
        ).toHaveLength(1);
        expect(
            await db
                .select()
                .from(userDisplayLanguageTable)
                .where(eq(userDisplayLanguageTable.userId, result.userId)),
        ).toHaveLength(1);
        expect(
            await db
                .select()
                .from(userSpokenLanguagesTable)
                .where(eq(userSpokenLanguagesTable.userId, result.userId)),
        ).toHaveLength(1);
    });

    it("blocks ticket creation after deletion locks the known user", async () => {
        const didWrite = "did:test:zupass:ticket-deletion";
        const userId = await createUser({ didWrite });
        const deletion = await startPendingDeletion({ userId });
        const verification = verifyTicket({ didWrite, nullifierHash: 2n });
        const rejection = expect(verification).rejects.toThrow(
            "Cannot authenticate inactive Zupass users",
        );

        await waitForAuthUserLock();
        await deletion.commit();
        await rejection;

        expect(await db.select().from(eventTicketTable)).toHaveLength(0);
    });

    it("blocks new-device login after deletion locks the ticket owner", async () => {
        const ownerId = await createUser({});
        await addTicket({ userId: ownerId, nullifier: "0x3" });
        const deletion = await startPendingDeletion({ userId: ownerId });
        const didWrite = "did:test:zupass:new-device-deletion";
        const verification = verifyTicket({ didWrite, nullifierHash: 3n });
        const rejection = expect(verification).rejects.toThrow(
            "Cannot authenticate inactive Zupass users",
        );

        await waitForAuthUserLock();
        await deletion.commit();
        await rejection;

        expect(
            await db
                .select()
                .from(deviceTable)
                .where(eq(deviceTable.didWrite, didWrite)),
        ).toHaveLength(0);
    });

    it("blocks known-device auth success after deletion locks the user", async () => {
        const didWrite = "did:test:zupass:known-device-deletion";
        const userId = await createUser({ didWrite });
        await addTicket({ userId, nullifier: "0x4" });
        const deletion = await startPendingDeletion({ userId });
        const verification = verifyTicket({ didWrite, nullifierHash: 4n });
        const rejection = expect(verification).rejects.toThrow(
            "Cannot authenticate inactive Zupass users",
        );

        await waitForAuthUserLock();
        await deletion.commit();
        await rejection;
    });
});
