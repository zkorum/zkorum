import { getPrimaryDatabase } from "@/shared-backend/db.js";
import {
    phoneSmsBudgetAlertTable,
    phoneSmsBudgetPolicyTable,
    phoneSmsBudgetReservationTable,
} from "@/shared-backend/schema.js";
import {
    and,
    eq,
    getTableColumns,
    gte,
    isNull,
    lt,
    lte,
    sql,
} from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PhoneCountry } from "@/shared/types/phone-country-policy.js";
import type { PhoneAuthMode } from "@/shared/types/phone-auth.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const ALERT_LEASE_MS = 5 * 60 * 1000;

export function getPhoneSmsMonthStart(now: Date): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function getNextPhoneSmsMonthStart(now: Date): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

type AlertKind = "warning" | "hard_limit";

const usageSchema = z.object({
    hourlySends: z.coerce.number().int().nonnegative(),
    dailySends: z.coerce.number().int().nonnegative(),
    hourlyCents: z.coerce.bigint().nonnegative(),
    dailyCents: z.coerce.bigint().nonnegative(),
    monthlyCents: z.coerce.bigint().nonnegative(),
});
type Usage = z.infer<typeof usageSchema>;

type Policy = typeof phoneSmsBudgetPolicyTable.$inferSelect;
type TimedPolicy = Policy & { dbNow: Date };

// Monthly spending and warning defaults live in the schema; burst caps are absent.
const DEFAULT_POLICY = {
    id: 1,
    sendingEnabled: true,
    estimatedCentsPerSend: 15,
} satisfies typeof phoneSmsBudgetPolicyTable.$inferInsert;

function exceedsBudget({
    policy,
    usage,
    nextSend,
    estimatedCents,
}: {
    policy: Policy;
    usage: Usage;
    nextSend: boolean;
    estimatedCents: number;
}): boolean {
    const sends = nextSend ? 1 : 0;
    const cents = nextSend ? BigInt(estimatedCents) : 0n;
    return (
        (policy.hourlySendLimit !== null &&
            usage.hourlySends + sends > policy.hourlySendLimit) ||
        (policy.dailySendLimit !== null &&
            usage.dailySends + sends > policy.dailySendLimit) ||
        (policy.hourlyBudgetCents !== null &&
            usage.hourlyCents + cents > BigInt(policy.hourlyBudgetCents)) ||
        (policy.dailyBudgetCents !== null &&
            usage.dailyCents + cents > BigInt(policy.dailyBudgetCents)) ||
        usage.monthlyCents + cents > BigInt(policy.monthlyBudgetCents)
    );
}

function crossesWarning({
    policy,
    usage,
}: {
    policy: Policy;
    usage: Usage;
}): boolean {
    return (
        (policy.hourlySendLimit !== null &&
            usage.hourlySends * 100 >=
                policy.hourlySendLimit * policy.warningPercent) ||
        (policy.dailySendLimit !== null &&
            usage.dailySends * 100 >=
                policy.dailySendLimit * policy.warningPercent) ||
        (policy.hourlyBudgetCents !== null &&
            usage.hourlyCents * 100n >=
                BigInt(policy.hourlyBudgetCents) *
                    BigInt(policy.warningPercent)) ||
        (policy.dailyBudgetCents !== null &&
            usage.dailyCents * 100n >=
                BigInt(policy.dailyBudgetCents) *
                    BigInt(policy.warningPercent)) ||
        usage.monthlyCents * 100n >=
            BigInt(policy.monthlyBudgetCents) * BigInt(policy.warningPercent)
    );
}

async function getUsage({
    db,
    now,
}: {
    db: PostgresJsDatabase;
    now: Date;
}): Promise<Usage> {
    const hourAgo = new Date(now.getTime() - HOUR_MS);
    const dayAgo = new Date(now.getTime() - DAY_MS);
    const monthStart = getPhoneSmsMonthStart(now);
    const earliest = new Date(Math.min(dayAgo.getTime(), monthStart.getTime()));
    const reservedAt = phoneSmsBudgetReservationTable.reservedAt;
    const estimatedCents = phoneSmsBudgetReservationTable.estimatedCents;
    const encodedHourAgo = sql.param(hourAgo, reservedAt);
    const encodedDayAgo = sql.param(dayAgo, reservedAt);
    const encodedMonthStart = sql.param(monthStart, reservedAt);
    // PostgreSQL FILTER has no Drizzle helper. Keep all windows in one aggregate
    // over the reservation table so they share one snapshot and one round trip.
    const rows = await db
        .select({
            hourlySends: sql`count(*) FILTER (WHERE ${reservedAt} >= ${encodedHourAgo})`,
            dailySends: sql`count(*) FILTER (WHERE ${reservedAt} >= ${encodedDayAgo})`,
            hourlyCents: sql`coalesce(sum(${estimatedCents}) FILTER (WHERE ${reservedAt} >= ${encodedHourAgo}), 0)`,
            dailyCents: sql`coalesce(sum(${estimatedCents}) FILTER (WHERE ${reservedAt} >= ${encodedDayAgo}), 0)`,
            monthlyCents: sql`coalesce(sum(${estimatedCents}) FILTER (WHERE ${reservedAt} >= ${encodedMonthStart}), 0)`,
        })
        .from(phoneSmsBudgetReservationTable)
        .where(
            and(
                gte(reservedAt, earliest),
                lt(reservedAt, getNextPhoneSmsMonthStart(now)),
            ),
        );
    return usageSchema.parse(rows.at(0));
}

async function queueAlert({
    db,
    kind,
    now,
}: {
    db: PostgresJsDatabase;
    kind: AlertKind;
    now: Date;
}): Promise<void> {
    await db
        .insert(phoneSmsBudgetAlertTable)
        .values({
            id: randomUUID(),
            kind,
            day: now.toISOString().slice(0, 10),
            nextAttemptAt: now,
        })
        .onConflictDoNothing();
}

async function pauseRegistration({
    db,
    now,
}: {
    db: PostgresJsDatabase;
    now: Date;
}): Promise<void> {
    const paused = (
        await db
            .update(phoneSmsBudgetPolicyTable)
            .set({
                registrationPausedAt: now,
                registrationPauseExpiresAt: getNextPhoneSmsMonthStart(now),
                updatedAt: now,
            })
            .where(
                and(
                    eq(phoneSmsBudgetPolicyTable.id, 1),
                    isNull(phoneSmsBudgetPolicyTable.registrationPausedAt),
                ),
            )
            .returning({
                registrationPausedAt:
                    phoneSmsBudgetPolicyTable.registrationPausedAt,
            })
    ).at(0);
    const pausedAt = paused?.registrationPausedAt;
    if (pausedAt === undefined || pausedAt === null) return;
    await queueAlert({ db, kind: "warning", now: pausedAt });
}

export function createPhoneSmsBudget({
    db,
    sendAlert,
    logError,
    costEstimates,
}: {
    db: PostgresJsDatabase;
    sendAlert?: (message: { subject: string; text: string }) => Promise<void>;
    logError: (error: unknown) => void;
    costEstimates: ReadonlyMap<PhoneCountry, number>;
}) {
    const primaryDb = getPrimaryDatabase(db);
    const destinationCosts = new Map(costEstimates);
    const costs = [...destinationCosts.values()];
    const cheapestCost = costs.length === 0 ? undefined : Math.min(...costs);
    const minimumEstimate = (policy: Policy): number | undefined =>
        cheapestCost === undefined
            ? undefined
            : Math.max(policy.estimatedCentsPerSend, cheapestCost);
    const estimateFor = ({
        policy,
        country,
    }: {
        policy: Policy;
        country: PhoneCountry;
    }): number | undefined => {
        const cost = destinationCosts.get(country);
        return cost === undefined
            ? undefined
            : Math.max(policy.estimatedCentsPerSend, cost);
    };
    let monitorTimer: NodeJS.Timeout | undefined;
    let draining = false;
    let monitorTask: Promise<void> | undefined;
    // Drizzle has no clock_timestamp() helper. Map the writer's clock alongside
    // each real policy/alert row so reservations and alerts share its time base.
    const dbClock = sql`clock_timestamp()`.mapWith((value) =>
        z.coerce.date().parse(value),
    );

    const readPolicy = async ({
        db,
        forUpdate,
    }: {
        db: PostgresJsDatabase;
        forUpdate: boolean;
    }): Promise<TimedPolicy | undefined> => {
        const query = () =>
            db
                .select({
                    ...getTableColumns(phoneSmsBudgetPolicyTable),
                    dbNow: dbClock,
                })
                .from(phoneSmsBudgetPolicyTable)
                .where(eq(phoneSmsBudgetPolicyTable.id, 1));
        let policy = (
            forUpdate ? await query().for("update") : await query()
        ).at(0);
        if (policy === undefined && forUpdate) {
            await db
                .insert(phoneSmsBudgetPolicyTable)
                .values(DEFAULT_POLICY)
                .onConflictDoNothing();
            policy = (await query().for("update")).at(0);
        }
        if (policy === undefined || !forUpdate) return policy;

        // Sample the writer's clock after a potentially month-spanning lock wait.
        const clock = (
            await db
                .select({ dbNow: dbClock })
                .from(phoneSmsBudgetPolicyTable)
                .where(eq(phoneSmsBudgetPolicyTable.id, 1))
        ).at(0);
        if (clock === undefined) return undefined;
        if (
            policy.registrationPauseExpiresAt !== null &&
            policy.registrationPauseExpiresAt <= clock.dbNow
        ) {
            await db
                .update(phoneSmsBudgetPolicyTable)
                .set({
                    registrationPausedAt: null,
                    registrationPauseExpiresAt: null,
                    updatedAt: clock.dbNow,
                })
                .where(eq(phoneSmsBudgetPolicyTable.id, 1));
            return {
                ...policy,
                dbNow: clock.dbNow,
                registrationPausedAt: null,
                registrationPauseExpiresAt: null,
            };
        }
        return { ...policy, dbNow: clock.dbNow };
    };

    const immediateMode = ({
        policy,
        forVerification,
    }: {
        policy: Policy;
        forVerification: boolean;
    }): PhoneAuthMode | undefined => {
        if (
            forVerification &&
            (!policy.sendingEnabled || policy.registrationPausedAt !== null)
        ) {
            return "login_only";
        }
        if (!forVerification && !policy.sendingEnabled) return "disabled";
        return undefined;
    };

    const modeForPolicy = ({
        policy,
        usage,
        forVerification,
        estimatedCents,
    }: {
        policy: Policy;
        usage: Usage;
        forVerification: boolean;
        estimatedCents: number | undefined;
    }): PhoneAuthMode => {
        const immediate = immediateMode({ policy, forVerification });
        if (immediate !== undefined) return immediate;
        if (estimatedCents === undefined)
            return forVerification ? "login_only" : "disabled";
        if (
            !forVerification &&
            exceedsBudget({ policy, usage, nextSend: true, estimatedCents })
        ) {
            return "disabled";
        }
        return policy.registrationPausedAt !== null ||
            crossesWarning({ policy, usage })
            ? "login_only"
            : "enabled";
    };

    const reconcilePolicy = async ({
        forVerification = false,
        country,
    }: {
        forVerification?: boolean;
        country?: PhoneCountry;
    } = {}): Promise<PhoneAuthMode> => {
        return await primaryDb.transaction(async (tx) => {
            const policy = await readPolicy({ db: tx, forUpdate: true });
            if (policy === undefined) return "disabled";
            const immediate = immediateMode({ policy, forVerification });
            if (immediate !== undefined) return immediate;

            const usage = await getUsage({ db: tx, now: policy.dbNow });
            const minimumCents = minimumEstimate(policy);
            if (
                policy.registrationPausedAt === null &&
                crossesWarning({ policy, usage })
            ) {
                await pauseRegistration({ db: tx, now: policy.dbNow });
            }
            if (
                policy.sendingEnabled &&
                minimumCents !== undefined &&
                exceedsBudget({
                    policy,
                    usage,
                    nextSend: true,
                    estimatedCents: minimumCents,
                })
            ) {
                await queueAlert({
                    db: tx,
                    kind: "hard_limit",
                    now: policy.dbNow,
                });
            }
            return modeForPolicy({
                policy,
                usage,
                forVerification,
                estimatedCents:
                    country === undefined
                        ? minimumCents
                        : estimateFor({ policy, country }),
            });
        });
    };

    const getMode = async ({
        forVerification = false,
        country,
    }: {
        forVerification?: boolean;
        country?: PhoneCountry;
    } = {}): Promise<PhoneAuthMode> => {
        const policy = await readPolicy({ db: primaryDb, forUpdate: false });
        if (
            policy === undefined ||
            (policy.registrationPauseExpiresAt !== null &&
                policy.registrationPauseExpiresAt <= policy.dbNow)
        ) {
            return await reconcilePolicy({ forVerification, country });
        }
        const immediate = immediateMode({ policy, forVerification });
        if (immediate !== undefined) return immediate;
        const usage = await getUsage({ db: primaryDb, now: policy.dbNow });
        if (
            policy.registrationPausedAt === null &&
            crossesWarning({ policy, usage })
        ) {
            return await reconcilePolicy({ forVerification, country });
        }
        return modeForPolicy({
            policy,
            usage,
            forVerification,
            estimatedCents:
                country === undefined
                    ? minimumEstimate(policy)
                    : estimateFor({ policy, country }),
        });
    };

    const reserve = async ({
        isRegistration,
        country,
    }: {
        isRegistration: boolean;
        country: PhoneCountry;
    }): Promise<boolean> => {
        return await primaryDb.transaction(async (tx) => {
            const policy = await readPolicy({ db: tx, forUpdate: true });
            if (policy?.sendingEnabled !== true) return false;
            const estimatedCents = estimateFor({ policy, country });
            if (estimatedCents === undefined) return false;
            const timestamp = policy.dbNow;
            const usage = await getUsage({ db: tx, now: timestamp });
            const minimumCents = minimumEstimate(policy);
            const warningReached = crossesWarning({ policy, usage });
            if (warningReached && policy.registrationPausedAt === null) {
                await pauseRegistration({ db: tx, now: timestamp });
            }
            if (
                isRegistration &&
                (policy.registrationPausedAt !== null || warningReached)
            ) {
                return false;
            }
            if (
                exceedsBudget({ policy, usage, nextSend: true, estimatedCents })
            ) {
                if (
                    minimumCents !== undefined &&
                    exceedsBudget({
                        policy,
                        usage,
                        nextSend: true,
                        estimatedCents: minimumCents,
                    })
                ) {
                    await queueAlert({
                        db: tx,
                        kind: "hard_limit",
                        now: timestamp,
                    });
                }
                return false;
            }
            await tx.insert(phoneSmsBudgetReservationTable).values({
                id: randomUUID(),
                reservedAt: timestamp,
                estimatedCents,
            });
            const after: Usage = {
                hourlySends: usage.hourlySends + 1,
                dailySends: usage.dailySends + 1,
                hourlyCents: usage.hourlyCents + BigInt(estimatedCents),
                dailyCents: usage.dailyCents + BigInt(estimatedCents),
                monthlyCents: usage.monthlyCents + BigInt(estimatedCents),
            };
            if (
                !warningReached &&
                policy.registrationPausedAt === null &&
                crossesWarning({ policy, usage: after })
            ) {
                await pauseRegistration({ db: tx, now: timestamp });
            }
            if (
                minimumCents !== undefined &&
                exceedsBudget({
                    policy,
                    usage: after,
                    nextSend: true,
                    estimatedCents: minimumCents,
                })
            ) {
                await queueAlert({
                    db: tx,
                    kind: "hard_limit",
                    now: timestamp,
                });
            }
            return true;
        });
    };

    const canRegister = async ({
        db: writer,
    }: {
        db: PostgresJsDatabase;
    }): Promise<boolean> => {
        const policy = await readPolicy({ db: writer, forUpdate: true });
        if (
            policy?.sendingEnabled !== true ||
            policy.monthlyBudgetCents === 0 ||
            cheapestCost === undefined
        )
            return false;
        const usage = await getUsage({ db: writer, now: policy.dbNow });
        if (
            crossesWarning({ policy, usage }) &&
            policy.registrationPausedAt === null
        )
            await pauseRegistration({ db: writer, now: policy.dbNow });
        return (
            policy.registrationPausedAt === null &&
            !crossesWarning({ policy, usage })
        );
    };

    const drainAlerts = async (): Promise<void> => {
        if (sendAlert === undefined || draining) return;
        draining = true;
        try {
            for (let i = 0; i < 5; i += 1) {
                const alert = await primaryDb.transaction(async (tx) => {
                    const due = (
                        await tx
                            .select({
                                id: phoneSmsBudgetAlertTable.id,
                                kind: phoneSmsBudgetAlertTable.kind,
                                day: phoneSmsBudgetAlertTable.day,
                                attemptCount:
                                    phoneSmsBudgetAlertTable.attemptCount,
                                dbNow: dbClock,
                            })
                            .from(phoneSmsBudgetAlertTable)
                            .where(
                                and(
                                    isNull(phoneSmsBudgetAlertTable.sentAt),
                                    lte(
                                        phoneSmsBudgetAlertTable.nextAttemptAt,
                                        sql`clock_timestamp()`,
                                    ),
                                ),
                            )
                            .orderBy(phoneSmsBudgetAlertTable.nextAttemptAt)
                            .limit(1)
                            .for("update", { skipLocked: true })
                    ).at(0);
                    if (due === undefined) return undefined;
                    await tx
                        .update(phoneSmsBudgetAlertTable)
                        .set({
                            attemptCount: due.attemptCount + 1,
                            nextAttemptAt: new Date(
                                due.dbNow.getTime() + ALERT_LEASE_MS,
                            ),
                        })
                        .where(eq(phoneSmsBudgetAlertTable.id, due.id));
                    return due;
                });
                if (alert === undefined) return;
                try {
                    await sendAlert({
                        subject:
                            alert.kind === "warning"
                                ? "Agora phone registration paused: SMS budget warning"
                                : "Agora phone SMS stopped: no budget capacity",
                        text:
                            alert.kind === "warning"
                                ? `Agora paused new phone registrations after reaching the SMS budget warning threshold on ${alert.day}. Existing phone login remains available within the hard cap. Automatic budget pauses expire at the next UTC calendar month, when usage is checked again. Review the phone_sms_budget_policy and phone_sms_budget_reservation tables.`
                                : `Agora cannot reserve another phone SMS under the UTC calendar-month or configured rolling-hour/day ceilings on ${alert.day}. No more phone SMS will be sent until capacity becomes available or you adjust the policy. Review the phone_sms_budget_policy and phone_sms_budget_reservation tables.`,
                    });
                    await primaryDb
                        .update(phoneSmsBudgetAlertTable)
                        .set({ sentAt: sql`clock_timestamp()` })
                        .where(
                            and(
                                eq(phoneSmsBudgetAlertTable.id, alert.id),
                                eq(
                                    phoneSmsBudgetAlertTable.attemptCount,
                                    alert.attemptCount + 1,
                                ),
                                isNull(phoneSmsBudgetAlertTable.sentAt),
                            ),
                        );
                } catch (error) {
                    logError(error);
                    const delayMs = Math.min(
                        60 * 60 * 1000,
                        60_000 * 2 ** Math.min(alert.attemptCount, 6),
                    );
                    await primaryDb
                        .update(phoneSmsBudgetAlertTable)
                        .set({
                            nextAttemptAt: sql`clock_timestamp() + (${delayMs} * interval '1 millisecond')`,
                        })
                        .where(
                            and(
                                eq(phoneSmsBudgetAlertTable.id, alert.id),
                                eq(
                                    phoneSmsBudgetAlertTable.attemptCount,
                                    alert.attemptCount + 1,
                                ),
                                isNull(phoneSmsBudgetAlertTable.sentAt),
                            ),
                        );
                }
            }
        } finally {
            draining = false;
        }
    };

    const start = (): void => {
        if (monitorTimer !== undefined) return;
        const monitor = async (): Promise<void> => {
            try {
                await reconcilePolicy();
                await drainAlerts();
            } catch (error) {
                logError(error);
            } finally {
                monitorTask = undefined;
            }
        };
        const runMonitor = (): void => {
            monitorTask ??= monitor();
        };
        runMonitor();
        monitorTimer = setInterval(runMonitor, 60_000);
        monitorTimer.unref();
    };

    const shutdown = async (): Promise<void> => {
        if (monitorTimer !== undefined) clearInterval(monitorTimer);
        monitorTimer = undefined;
        await monitorTask;
    };

    return {
        getMode,
        reserve,
        canRegister,
        drainAlerts,
        start,
        shutdown,
    };
}

export type PhoneSmsBudget = Pick<
    ReturnType<typeof createPhoneSmsBudget>,
    "reserve" | "canRegister"
>;
