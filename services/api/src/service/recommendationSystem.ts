import { sql } from "drizzle-orm";
import type { SqlExpression } from "@/utils/sqlExpression.js";

/** The logarithm preserves the original exponential score's ordering without overflowing. */
export function conversationEngagementScore({
    createdAt,
    lastReactedAt,
    opinionCount,
    voteCount,
    participantCount,
    rankedAt,
}: {
    createdAt: SqlExpression<Date>;
    lastReactedAt: SqlExpression<Date>;
    opinionCount: SqlExpression<number>;
    voteCount: SqlExpression<number>;
    participantCount: SqlExpression<number>;
    rankedAt: Date;
}) {
    // PostgreSQL has no Drizzle helpers for log-sum-exp. Clamp negligible terms
    // before exp(): PostgreSQL reports underflow instead of returning zero.
    const terms = [
        sql`-0.4 * extract(epoch from (${rankedAt.toISOString()}::timestamp - ${createdAt})) / 86400.0`,
        sql`-0.3 * extract(epoch from (${rankedAt.toISOString()}::timestamp - ${lastReactedAt})) / 86400.0`,
        sql`0.6 * ${opinionCount}`,
        sql`0.5 * ${voteCount}`,
        sql`0.4 * ${participantCount}`,
    ];
    const maximum = sql`greatest(${sql.join(terms, sql`, `)})`;
    const exponentials = terms.map(
        (term) =>
            sql`exp(greatest(-700.0, (${term}) - (${maximum}))::double precision)`,
    );
    return sql<number>`((${maximum})::double precision + ln(${sql.join(exponentials, sql` + `)}))`.mapWith(
        Number,
    );
}
