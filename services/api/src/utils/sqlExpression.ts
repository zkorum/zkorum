import type { SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export type SqlExpression<T> =
    | AnyPgColumn<{ data: T }>
    | SQL<T>
    | SQL.Aliased<T>;
