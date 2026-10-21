import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
    dispatchRealtimeEventBatch,
    fetchDeliveredEventUpperBound,
} from "../src/service/realtimeEventDispatch.js";
import {
    realtimeEventDispatchStateTable,
    realtimeEventOutboxTable,
} from "../src/shared-backend/schema.js";

function latch() {
    let release: () => void = () => undefined;
    const promise = new Promise<void>((resolve) => {
        release = resolve;
    });
    return { promise, release };
}

describe("realtime delivery migration and dispatch", () => {
    let container: StartedTestContainer;
    let client: postgres.Sql;
    let db: PostgresJsDatabase;

    beforeAll(async () => {
        container = await new GenericContainer("postgres:16-alpine")
            .withEnvironment({
                POSTGRES_USER: "postgres",
                POSTGRES_PASSWORD: "postgres",
                POSTGRES_DB: "agora_test",
            })
            .withExposedPorts(5432)
            .start();
        client = postgres({
            host: container.getHost(),
            port: container.getMappedPort(5432),
            database: "agora_test",
            username: "postgres",
            password: "postgres",
        });
        db = drizzle(client);
        // Exercise the real generated migration against the previous table shape.
        await client.unsafe(`
            CREATE TABLE realtime_event_outbox (
                id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                event_type varchar(100) NOT NULL, payload jsonb NOT NULL,
                created_at timestamp(0) NOT NULL DEFAULT now()
            );
            CREATE INDEX realtime_event_outbox_conversation_replay_idx ON realtime_event_outbox(id);
            CREATE INDEX realtime_event_outbox_ranking_replay_idx ON realtime_event_outbox(id);
            INSERT INTO realtime_event_outbox(event_type, payload)
            SELECT 'migration_fixture', jsonb_build_object('fixture', repeat('x', 512))
            FROM generate_series(1, 41460);
        `);
        await client.unsafe(
            readFileSync(
                new URL(
                    "../database/flyway/V0062.4__create_realtime_event_outbox_notify_trigger.sql",
                    import.meta.url,
                ),
                "utf8",
            ),
        );
        await client.unsafe(
            readFileSync(
                new URL(
                    "../database/flyway/V0109__faithful_whiplash.sql",
                    import.meta.url,
                ),
                "utf8",
            ),
        );
        await client.begin(async (tx) => {
            await tx.unsafe(
                readFileSync(
                    new URL(
                        "../database/flyway/V0109.1__initialize_realtime_delivery_order.sql",
                        import.meta.url,
                    ),
                    "utf8",
                ),
            );
        });
    }, 120_000);
    afterAll(async () => {
        await client?.end({ timeout: 5 });
        await container?.stop();
    });

    it("bootstraps existing history and starts after its highest delivery number", async () => {
        const rows = await db
            .select({
                id: realtimeEventOutboxTable.id,
                deliveryId: realtimeEventOutboxTable.deliveryId,
            })
            .from(realtimeEventOutboxTable);
        expect(rows).toHaveLength(41460);
        expect(rows.every((row) => row.id === row.deliveryId)).toBe(true);
        await db
            .insert(realtimeEventOutboxTable)
            .values({ eventType: "after_migration", payload: {} });
        expect(await fetchDeliveredEventUpperBound(db)).toBe(41461);
    });

    it("does not hold a business writer barrier while a dispatcher is busy", async () => {
        const acquired = latch();
        const release = latch();
        const dispatcher = db.transaction(async (tx) => {
            await tx
                .select()
                .from(realtimeEventDispatchStateTable)
                .where(eq(realtimeEventDispatchStateTable.id, 1))
                .for("update");
            acquired.release();
            await release.promise;
        });
        await acquired.promise;
        try {
            await db
                .insert(realtimeEventOutboxTable)
                .values({ eventType: "during_dispatch", payload: {} });
            expect(await dispatchRealtimeEventBatch(db)).toBe(0);
        } finally {
            release.release();
            await dispatcher;
        }
        expect(await dispatchRealtimeEventBatch(db)).toBe(1);
    });

    it("publishes bounded batches and wakes listeners only after assignment commits", async () => {
        const payload = JSON.stringify({ fixture: true });
        await client`INSERT INTO realtime_event_outbox(event_type, payload)
            SELECT 'batch_fixture', ${payload}::jsonb FROM generate_series(1, 501)`;
        const notified = latch();
        const notifications: string[] = [];
        const listener = await client.listen(
            "realtime_event_outbox",
            (payload) => {
                notifications.push(payload);
                notified.release();
            },
        );
        try {
            expect(await dispatchRealtimeEventBatch(db)).toBe(500);
            await notified.promise;
            expect(notifications).toEqual(['{"deliveryAssigned":true}']);
            expect(await dispatchRealtimeEventBatch(db)).toBe(1);
            expect(await dispatchRealtimeEventBatch(db)).toBe(0);
        } finally {
            await listener.unlisten();
        }
    });
});
