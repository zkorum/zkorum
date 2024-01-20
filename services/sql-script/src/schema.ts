import { eq } from "drizzle-orm";
import {
    char,
    pgEnum,
    pgTable,
    timestamp,
    uuid,
    varchar,
    integer,
    boolean,
    serial,
    customType,
    text,
    jsonb,
    uniqueIndex,
} from "drizzle-orm/pg-core";
// import { MAX_LENGTH_OPTION, MAX_LENGTH_TITLE } from "./shared/shared.js"; // unfortunately it breaks drizzle generate... :o TODO: find a way
const MAX_LENGTH_OPTION = 30;
const MAX_LENGTH_TITLE = 140;
const MAX_LENGTH_COMMENT = 1250;
const MAX_LENGTH_BODY = 3000;

export const bytea = customType<{
    data: string;
    notNull: false;
    default: false;
}>({
    dataType() {
        return "bytea";
    },
    toDriver(val: string): Uint8Array {
        const buffer = Buffer.from(val, "base64url");
        return Uint8Array.from(buffer);
    },
    fromDriver(val): string {
        return Buffer.from(val as Uint8Array).toString("base64url");
    },
});

// One user == one account.
// Inserting a record in that table means that the user has been successfully registered.
// To one user can be associated multiple validated emails and devices.
// Emails and devices must only be associated with exactly one user.
// The association between users and devices/emails can change over time.
// A user must have at least 1 validated primary email and 1 device associated with it.
// The "at least one" conditon is not enforced directly in the SQL model yet. It is done in the application code.
export const userTable = pgTable("user", {
    id: uuid("id").primaryKey(), // enforce the same key for the user in the frontend across email changes
    uid: char("uid", { length: 64 }).unique().notNull(), // @see generateRandomHex() - crypto random hex number for anonymous credential - should be kept secret. We cannot use the already existing UUID because it is not secured across the stack the same way and UUID is too long (36 bytes) to be used by the Dock crypto-wasm-ts library that we use for ZKP and anonymous credentials
    isAdmin: boolean("is_admin").notNull().default(false), // if true, can moderate content
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// if user explicity logs in with the primary or any backup emails, the validation email is sent to the specified address on login.
// if user logs in by entering a "secondary" or "other" type of email associated with their account, send validation email to the primary email associated with their account.
// once this passed, the backend will send one-time password to secondary email addresses and user will have to verify them (multi-factor)
// "other" emails are email addresses associated with the account but which are not used for login
// TODO this is not implemented yet, there is only primary - will be added together with other types of 2FA in the future
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
    email: varchar("email", { length: 254 }).notNull().primaryKey(),
    type: emailType("type").notNull(),
    userId: uuid("user_id")
        .references(() => userTable.id)
        .notNull(),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
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
    // TODO: isTrusted: boolean("is_trusted").notNull(), // if set to true by user then, device should stay logged-in indefinitely until log out action
    sessionExpiry: timestamp("session_expiry").notNull(), // on register, a new login session is always started, hence the notNull. This column is updated to now + 15 minutes at each request when isTrusted == false. Otherwise, expiry will be now + 1000 years - meaning no expiry.
    encryptedSymmKey: bytea("encrypted_symm_key"), // symmetric key used for client-side encryption. Devices belonging to the same user and with encryptedSymmKey!=null automatically sync credentials and presentations between each other
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// this contains a tuple that cannot easily be mapped to enum AuthenticateType
// TODO: use zod or something to maintain one set of type only
export const authType = pgEnum("auth_type", [
    "register",
    "login_known_device",
    "login_new_device",
]);

// This table serves as a transitory store of information between the intial register attempt and the validation of the one-time code sent to the email address (no multi-factor because it is register)
// the record will be first created as "register" or "login_new_device", and latter updated to "login_known_device" on next authenticate action
// TODO: this table may have to be broke down when introducing 2FA
export const authAttemptTable = pgTable("auth_attempt", {
    didWrite: varchar("did_write", { length: 1000 }).primaryKey(), // TODO: make sure of length
    type: authType("type").notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    userId: uuid("user_id").notNull(),
    didExchange: varchar("did_exchange", { length: 1000 }).notNull(), // TODO: make sure of length
    code: integer("code").notNull(), // one-time password sent to the email ("otp")
    codeExpiry: timestamp("code_expiry").notNull(),
    guessAttemptAmount: integer("guess_attempt_amount").default(0).notNull(),
    lastEmailSentAt: timestamp("last_email_sent_at").notNull(),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// "emailCredential" is an Email-specific verifiable credential only containing the email and issued by ZKorum, as opposed to a VC issued by an external authority. It contains the result of the forms filled by the associated user.
// this table may contain revoke credentials
// TODO: make sure there are always one and only one active credential (not revoked)
export const credentialEmailTable = pgTable(
    "credential_email",
    {
        id: serial("id").primaryKey(),
        credential: jsonb("credential").$type<object>().notNull(), // encoded credential
        isRevoked: boolean("is_revoked").notNull().default(false),
        email: varchar("email", { length: 254 })
            .references(() => emailTable.email)
            .notNull(),
        pkVersion: integer("pk_version").default(1).notNull(),
        createdAt: timestamp("created_at", {
            mode: "date",
            precision: 0,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", {
            mode: "date",
            precision: 0,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            credEmUniqueEmailNotRevoked: uniqueIndex(
                "cred_em_unique_email_not_revoked"
            )
                .on(table.email)
                .where(eq(table.isRevoked, false)),
        };
    }
);

// formCredential" is an Email-specific Form verifiable credential issued by ZKorum, as opposed to a VC issued by an external authority. It contains the result of the forms filled by the associated user.
// this table may contain revoke credentials
// TODO: make sure there are always one and only one active credential (not revoked)
export const credentialFormTable = pgTable(
    "credential_form",
    {
        id: serial("id").primaryKey(),
        credential: jsonb("credential").$type<object>().notNull(), // encoded credential
        isRevoked: boolean("is_revoked").notNull().default(false),
        email: varchar("email", { length: 254 })
            .references(() => emailTable.email)
            .notNull(),
        pkVersion: integer("pk_version").default(1).notNull(),
        createdAt: timestamp("created_at", {
            mode: "date",
            precision: 0,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", {
            mode: "date",
            precision: 0,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => {
        return {
            credFoUniqueEmailNotRevoked: uniqueIndex(
                "cred_fo_unique_email_not_revoked"
            )
                .on(table.email)
                .where(eq(table.isRevoked, false)),
        };
    }
);

// TODO: merge with the value in zod...
export const secretCredentialType = pgEnum("credential_secret_type", [
    "unbound",
    "timebound",
]);

// "secretCredential" is a blinded credential that contains a blinded secret used for creating a post or responding as comments, NOT for responding to a vote/poll. Same secret means generating the same pseudonym across usage. No need for unicity when recovery after loss as this pseudonym is not used for polling/voting and we don't care about double vote, but a fixed pseudonym is necessary for moderation.
// on secret loss, user would start the recovery process which is rate-limited and only allowed if the user is not banned/suspended. On recovery user would generate a brand new secret and hence have a brand new pseudonym.
// this table may contained revoke credentials
// it is necessary to keep them for the frontend to be able to regenerate to revoked pseudonyms.
// pollId: the UUID for responding to the poll. If null, it is the global secret
export const credentialSecretTable = pgTable(
    "credential_secret",
    {
        id: serial("id").primaryKey(),
        type: secretCredentialType("type").notNull(),
        credential: jsonb("credential").$type<object>().notNull(),
        encryptedBlinding: text("encrypted_blinding").notNull(),
        encryptedBlindedSubject: text("encrypted_blinded_subject").notNull(),
        isRevoked: boolean("is_revoked").notNull().default(false),
        userId: uuid("user_id")
            .references(() => userTable.id)
            .notNull(),
        pkVersion: integer("pk_version").default(1).notNull(),
        createdAt: timestamp("created_at", {
            mode: "date",
            precision: 0,
        })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", {
            mode: "date",
            precision: 0,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => {
        return {
            credSeuniqueUserIdNotRevoked: uniqueIndex(
                "cred_se_unique_user_id_not_revoked"
            )
                .on(table.userId, table.type)
                .where(eq(table.isRevoked, false)),
        };
    }
);

// TODO: use zod or something to maintain one set of type only
export const credentialType = pgEnum("credential_type", [
    "university",
    "company",
    // TODO
]);

// TODO: use zod or something to maintain one set of type only
export const universityType = pgEnum("university_type", [
    "student",
    "alum",
    "faculty",
    // TODO
]);

// TODO: add table for default values for universities that frontend can select from
// TODO: add table for overriden values for each universities (starting from essec)

export const facultyPersonaTable = pgTable("faculty_persona", {
    id: serial("id").primaryKey(),
    // TODO: add attributes
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const facultyEligibilityTable = pgTable("faculty_eligibility", {
    id: serial("id").primaryKey(),
    // TODO: add attributes
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const alumPersonaTable = pgTable("alum_persona", {
    id: serial("id").primaryKey(),
    // TODO: add attributes
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const alumEligibilityTable = pgTable("alum_eligibility", {
    id: serial("id").primaryKey(),
    // TODO: add attributes
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const studentPersonaTable = pgTable("student_persona", {
    id: serial("id").primaryKey(),
    campus: varchar("campus", { length: 255 }), // "cergy" or "rabat" for example - may be null because other univ than essec won't have this option by default
    program: varchar("program", { length: 255 }), // "MiM" or "PhD" for example
    admissionYear: integer("admissionYear"), // "MiM" or "PhD" for example
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const studentEligibilityTable = pgTable("student_eligibility", {
    id: serial("id").primaryKey(),
    campuses: varchar("campus", { length: 255 }).array(),
    programs: varchar("program", { length: 255 }).array(),
    admissionYears: integer("admissionYear").array(), // "MiM" or "PhD" for example
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const universityPersonaTable = pgTable("university_persona", {
    id: serial("id").primaryKey(),
    type: universityType("type").notNull(),
    countries: char("countries", { length: 2 }).array(), // holds TCountryCode
    studentPersonaId: integer("student_persona_id").references(
        () => studentPersonaTable.id
    ),
    alumPersonaId: integer("alum_persona_id").references(
        () => alumPersonaTable.id
    ),
    facultyPersonaId: integer("faculty_persona_id").references(
        () => facultyPersonaTable.id
    ),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const universityEligibilityTable = pgTable("university_eligibility", {
    id: serial("id").primaryKey(),
    types: universityType("types").array(),
    countries: char("countries", { length: 2 }).array(), // holds TCountryCode
    studentEligibilityId: integer("student_eligibility_id").references(
        () => studentEligibilityTable.id
    ), // if not null then type must contain "student"
    alumEligibilityId: integer("alum_eligibility_id").references(
        () => alumEligibilityTable.id
    ),
    facultyEligibilityId: integer("faculty_eligibility_id").references(
        () => facultyEligibilityTable.id
    ),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// note that external credentials & combining multiple email credentials aren't supported yet
// TODO: would be nice to find a way to enforce unique persona per entry as there are only a limited number of possible combination...
export const personaTable = pgTable("persona", {
    id: serial("id").primaryKey(),
    domain: varchar("domain", { length: 255 }).notNull(), // should be enough for subdomains? TODO: test that
    type: credentialType("type").notNull(),
    universityPersonaId: integer("university_persona_id").references(
        () => universityPersonaTable.id
    ),
    // TODO add other potential persona - one of them should not be null
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// TODO: would be nice to find a way to enforce unique eligibility per entry as there are only a limited number of possible combination... (though much more than personas)
export const eligibilityTable = pgTable("eligibility", {
    id: serial("id").primaryKey(),
    domains: varchar("domain", { length: 255 }).array(),
    types: credentialType("type").array(),
    universityEligibilityId: integer("university_eligibility_id").references(
        () => universityEligibilityTable.id
    ),
    // TODO add other potential eligibility subtype
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const pseudonymTable = pgTable("pseudonym", {
    id: serial("id").primaryKey(),
    pseudonym: text("pseudonym").unique().notNull(), // should be unique, unless we mess up with the scopes... Change type to varchar? I don't know how long a pseudonym can be...
    personaId: integer("persona_id")
        .references(() => personaTable.id)
        .notNull(),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// TODO rename poll to post
export const pollOptionsTable = pgTable("poll_options", {
    id: serial("id").primaryKey(),
    postId: integer("post_id") // "postAs"
        .notNull()
        .unique() // currently, a poll can only be associated with one post
        .references(() => pollTable.id), // the author of the poll
    option1: varchar("option1", { length: MAX_LENGTH_OPTION }).notNull(),
    option1Response: integer("option1_response").default(0).notNull(),
    option2: varchar("option2", { length: MAX_LENGTH_OPTION }).notNull(),
    option2Response: integer("option2_response").default(0).notNull(),
    option3: varchar("option3", { length: MAX_LENGTH_OPTION }),
    option3Response: integer("option3_response"),
    option4: varchar("option4", { length: MAX_LENGTH_OPTION }),
    option4Response: integer("option4_response"),
    option5: varchar("option5", { length: MAX_LENGTH_OPTION }),
    option5Response: integer("option5_response"),
    option6: varchar("option6", { length: MAX_LENGTH_OPTION }),
    option6Response: integer("option6_response"),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

// TODO rename poll to post
export const pollTable = pgTable("poll", {
    id: serial("id").primaryKey(),
    slugId: varchar("slug_id", { length: 10 }).notNull().unique(), // used for permanent URL, should be not null and unique, a script will populate them...
    presentation: jsonb("presentation").$type<object>().notNull(), // verifiable presentation as received
    presentationCID: char("pres_cid", { length: 61 }).unique().notNull(), // unique and notNull are !important for avoiding replay attacks, we will do it in a later release
    timestampedPresentationCID: char("time_pres_cid", { length: 61 }) // see shared/test/common/cid.test.ts for length
        .notNull()
        .unique(), // CID calculated from stringified object representing pres+created_at. This is the unique identifier representing the poll globally.
    authorId: integer("author_id") // "postAs"
        .notNull()
        .references(() => pseudonymTable.id), // the author of the poll
    eligibilityId: integer("eligibility_id")
        .notNull()
        .references(() => eligibilityTable.id),
    title: varchar("title", { length: MAX_LENGTH_TITLE }).notNull(),
    body: varchar("body", { length: MAX_LENGTH_BODY }),
    option1: varchar("option1", { length: MAX_LENGTH_OPTION }).notNull(),
    option1Response: integer("option1_response").default(0).notNull(),
    option2: varchar("option2", { length: MAX_LENGTH_OPTION }).notNull(),
    option2Response: integer("option2_response").default(0).notNull(),
    option3: varchar("option3", { length: MAX_LENGTH_OPTION }),
    option3Response: integer("option3_response"),
    option4: varchar("option4", { length: MAX_LENGTH_OPTION }),
    option4Response: integer("option4_response"),
    option5: varchar("option5", { length: MAX_LENGTH_OPTION }),
    option5Response: integer("option5_response"),
    option6: varchar("option6", { length: MAX_LENGTH_OPTION }),
    option6Response: integer("option6_response"),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    lastReactedAt: timestamp("last_reacted_at", {
        // latest response to poll or comment
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    commentCount: integer("comment_count").notNull().default(0),
});

export const pollResponseTable = pgTable("poll_response", {
    id: serial("id").primaryKey(),
    presentation: jsonb("presentation").$type<object>().notNull(), // verifiable presentation as received
    presentationCID: char("pres_cid", { length: 61 }).unique().notNull(), // unique and notNull are !important for avoiding replay attacks, we will do it in a later release
    timestampedPresentationCID: char("time_pres_cid", { length: 61 })
        .unique()
        .notNull(), // CID calculated from stringified object representing pres+created_at. This is the unique identifier representing the response globally.
    authorId: integer("author_id") // "postAs"
        .notNull()
        .references(() => pseudonymTable.id), // the author of the poll
    pollId: integer("poll_id")
        .notNull()
        .references(() => pollOptionsTable.id),
    optionChosen: integer("option_chosen").notNull(),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});

export const commentTable = pgTable("comment", {
    id: serial("id").primaryKey(),
    slugId: varchar("slug_id", { length: 10 }).notNull().unique(), // used for permanent URL
    presentation: jsonb("presentation").$type<object>().notNull(), // verifiable presentation as received
    presentationCID: char("pres_cid", { length: 61 }).notNull().unique(), // unique and notNull are !important for avoiding replay attacks
    timestampedPresentationCID: char("time_pres_cid", { length: 61 }) // see shared/test/common/cid.test.ts for length
        .notNull()
        .unique(), // CID calculated from stringified object representing pres+created_at. This is the unique identifier representing the comment globally.
    authorId: integer("author_id") // "postAs"
        .notNull()
        .references(() => pseudonymTable.id), // the author of the poll
    content: varchar("content", { length: MAX_LENGTH_COMMENT }).notNull(),
    postId: integer("post_id")
        .references(() => pollTable.id)
        .notNull(),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull(),
});
