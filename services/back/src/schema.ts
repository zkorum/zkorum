import {
  boolean,
  char,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// One user == one account.
// Inserting a record in that table means that the user has been successfully registered.
// To one user can be associated multiple validated emails and devices.
// Emails and devices must only be associated with exactly one user.
// The association between users and devices/emails can change over time.
// A user must have at least 1 validated primary email and 1 device associated with it.
// The "at least one" conditon is not enforced directly in the SQL model yet. It is done in the application code.
export const userTable = pgTable("user", {
  id: uuid("id").primaryKey(), // enforce the same key for the user in the frontend across email changes
  uid: char("uid", { length: 16 }).unique().notNull(), // @see generateRandomHex() - crypto random hex number for anonymous credential - should be kept secret. We cannot use the already existing UUID because it is not secured across the stack the same way and UUID is too long (36 bytes) to be used by the Dock crypto-wasm-ts library that we use for ZKP and anonymous credentials
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// if user explicity logs in with the primary or any backup emails, the validation email is sent to the specified address on login.
// if user logs in by entering a "secondary" or "other" type of email associated with their account, send validation email to the primary email associated with their account.
// once this passed, the backend will send one-time password to secondary email addresses and user will have to verify them (multi-factor)
// "other" emails are email addresses associated with the account but which are not used for login
// TODO multi-factor and backup emails are not implemented yet - will be added together with other types of 2FA in the future
export const emailType = pgEnum("email_type", [
  "primary",
  "backup",
  "secondary",
  "other",
]);

// The process of changing emails, especially primary email, is stricly controlled.
// Emails cannot be shared among users. There is no plan to add "company" or "team" super-users at the moment.
// In a team, each individual has an account with their own email address, and a few of them can be admin of the group they created.
// That's why email is primaryKey even though it can change from a user's perspective: changing an email is considered adding another record to this table, and removing the old one.
// Emails in that table have already been validated by the user at least once and are related to an existing registered user.
export const emailTable = pgTable("email", {
  email: varchar("email", { length: 254 }).primaryKey(),
  type: emailType("type").notNull(),
  userId: uuid("user_id")
    .references(() => userTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// A device corresponds in fact to a browser instance. But since the app is installable, we can expect that the user will only use one browser per device, hence the name of this table.
// When logging in, the browser generates an asymmetric key pair, which translates into a set of two did:key: didWrite is used to sign/verify messages (and hence used for UCAN), while didExchange is exclusively used to encrypt/decrypt data. This separation is due to the WebCrypto API, see: https://github.com/fission-codes/keystore-idb
// Devices in that table are associated with a user that have been successfully registered.
export const deviceTable = pgTable("device", {
  didWrite: varchar("did_write", { length: 1000 }).primaryKey(), // TODO: make sure of length
  didExchange: varchar("did_exchange", { length: 1000 }).unique().notNull(), // TODO: make sure of length
  userId: uuid("user_id")
    .references(() => userTable.id)
    .notNull(),
  isTrusted: boolean("is_trusted").notNull(), // if set to true by user then, device should stay logged-in indefinitely until log out action
  sessionExpiry: timestamp("session_expiry").notNull(), // on register, a new login session is always started, hence the notNull. This column is updated to now + 15 minutes at each request when isTrusted == false. Otherwise, expiry will be now + 1000 years - meaning no expiry.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authType = pgEnum("auth_type", [
  "register",
  "login_known_device",
  "login_new_device",
]);

// the record will be first created as "register" or "login_new_device", and latter updated to "login_known_device" on next authenticate action
export const authAttemptTable = pgTable("auth_attempt", {
  didWrite: varchar("did_write", { length: 1000 }).primaryKey(), // TODO: make sure of length
  type: authType("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// This table serves as a transitory store of information between the intial register attempt and the validation of the one-time code sent to the email address (no multi-factor because it is register)
export const registerAttemptTable = pgTable("register_attempt", {
  didWrite: varchar("did_write", { length: 1000 }).primaryKey(), // TODO: make sure of length
  email: varchar("email", { length: 254 }).notNull(),
  userId: uuid("user_id").notNull(),
  didExchange: varchar("did_exchange", { length: 1000 }).notNull(), // TODO: make sure of length
  isTrusted: boolean("is_trusted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// this table could be merged with the above one, but we keep it separate for consistency purposes with the login tables
export const registerOtpEmailTable = pgTable("register_otp_email", {
  id: serial("id").primaryKey(),
  didWrite: varchar("did_write", { length: 1000 })
    .references(() => registerAttemptTable.didWrite)
    .notNull(),
  code: char("code", { length: 6 }).notNull(), // one-time password sent to the email ("otp")
  codeExpiry: timestamp("code_expiry").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// This table serves as a transitory store of information between the initial attempt to login from a new device and the validation of the one-time code sent to the email address (+ eventual multi-factor)
export const loginNewDeviceAttemptTable = pgTable("login_new_device_attempt", {
  didWrite: varchar("did_write", { length: 1000 }).primaryKey(), // TODO: make sure of length
  email: varchar("email", { length: 254 })
    .references(() => emailTable.email)
    .notNull(),
  userId: uuid("user_id")
    .references(() => userTable.id)
    .notNull(),
  didExchange: varchar("did_exchange", { length: 1000 }).notNull(), // TODO: make sure of length
  isTrusted: boolean("is_trusted").notNull(), // for now we only implemented behaviour when isTrusted=true
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// login new device attempt - otp sent to emails (primary/backup or secondary)
export const loginNewDeviceOtpEmailTable = pgTable("login_nd_otp_email", {
  id: serial("id").primaryKey(),
  didWrite: varchar("did_write", { length: 1000 })
    .references(() => loginNewDeviceAttemptTable.didWrite)
    .notNull(),
  email: varchar("email", { length: 254 })
    .references(() => emailTable.email) // could be the primary email when registerAttempt.email is "other" email from same account, could also be a "secondary" email during multi-factor verification
    .notNull(),
  code: char("code", { length: 6 }).notNull(), // one-time password sent to the email ("otp")
  codeExpiry: timestamp("code_expiry").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// This table serves as a transitory store of information between the initial attempt to login from a new device and the validation of the one-time code sent to the email address (+ eventual multi-factor)
export const loginKnownDeviceAttemptTable = pgTable(
  "login_known_device_attempt",
  {
    didWrite: varchar("did_write", { length: 1000 }) // TODO: make sure of length
      .primaryKey()
      .references(() => deviceTable.didWrite)
      .notNull(),
    email: varchar("email", { length: 254 })
      .references(() => emailTable.email)
      .notNull(),
    userId: uuid("user_id")
      .references(() => userTable.id)
      .notNull(),
    didExchange: varchar("did_exchange", { length: 1000 }) // TODO: make sure of length
      .references(() => deviceTable.didExchange)
      .notNull(),
    isTrusted: boolean("is_trusted").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

// login known device attempt - otp sent to emails (primary/backup or secondary)
export const loginKnownDeviceOtpEmailTable = pgTable("login_kd_otp_email", {
  id: serial("id").primaryKey(),
  didWrite: varchar("did_write", { length: 1000 })
    .references(() => loginKnownDeviceAttemptTable.didWrite)
    .notNull(),
  email: varchar("email", { length: 254 })
    .references(() => emailTable.email) // could be the primary email when registerAttempt.email is "other" email from same account, could also be a "secondary" email during multi-factor verification
    .notNull(),
  code: char("code", { length: 6 }).notNull(), // one-time code
  codeExpiry: timestamp("code_expiry").notNull(), // one-time code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
