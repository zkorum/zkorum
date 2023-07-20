import {
  char,
  date,
  integer,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: serial("id").primaryKey(),
  uid: char("uid", { length: 16 }).notNull(),
  createdAt: date("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: date("updated_at", { mode: "date" }).defaultNow().notNull(),
  username: varchar("username", { length: 32 }).unique().notNull(),
});

export const emailTable = pgTable("email", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 254 }).unique().notNull(),
  userId: integer("user_id")
    .references(() => userTable.id)
    .notNull(),
});

export const deviceTable = pgTable("device", {
  id: serial("id").primaryKey(),
  did: varchar("did", { length: 254 }).unique().notNull(), // TODO: make sure of length
  userId: integer("user_id")
    .references(() => userTable.id)
    .notNull(),
});

// export const userHasManyEmails = relations(user, ({ many }) => ({
//   emails: many(email)
// }));

// export const emailHasOneUser = relations(email, ({one}) => ({
//   user: one(user, {
//     fields: [email.userId],
//     references: [user.id],
//   })

// }));
