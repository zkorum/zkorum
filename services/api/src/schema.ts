import {
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
    real,
    type AnyPgColumn,
} from "drizzle-orm/pg-core";
// import { MAX_LENGTH_OPTION, MAX_LENGTH_TITLE, MAX_LENGTH_COMMENT, MAX_LENGTH_BODY } from "./shared/shared.js"; // unfortunately it breaks drizzle generate... :o TODO: find a way
// WARNING - change this in shared.ts as well
const MAX_LENGTH_OPTION = 30;
const MAX_LENGTH_TITLE = 65;
const MAX_LENGTH_BODY = 140;
const MAX_LENGTH_COMMENT = 280;
const MAX_LENGTH_NAME_CREATOR = 65;
const MAX_LENGTH_DESCRIPTION_CREATOR = 280;

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

export const countryCodeEnum = pgEnum("country_code", ["AND", "ARE", "AFG", "ATG", "AIA", "ALB", "ARM", "AGO", "ATA", "ARG", "ASM", "AUT", "AUS", "ABW", "ALA", "AZE", "BIH", "BRB", "BGD", "BEL", "BFA", "BGR", "BHR", "BDI", "BEN", "BLM", "BMU", "BRN", "BOL", "BES", "BRA", "BHS", "BTN", "BVT", "BWA", "BLR", "BLZ", "CAN", "CCK", "COD", "CAF", "COG", "CHE", "CIV", "COK", "CHL", "CMR", "CHN", "COL", "CRI", "CUB", "CPV", "CUW", "CXR", "CYP", "CZE", "DEU", "DJI", "DNK", "DMA", "DOM", "DZA", "ECU", "EST", "EGY", "ESH", "ERI", "ESP", "ETH", "FIN", "FJI", "FLK", "FSM", "FRO", "FRA", "GAB", "GBR", "GRD", "GEO", "GUF", "GGY", "GHA", "GIB", "GRL", "GMB", "GIN", "GLP", "GNQ", "GRC", "SGS", "GTM", "GUM", "GNB", "GUY", "HKG", "HMD", "HND", "HRV", "HTI", "HUN", "IDN", "IRL", "ISR", "IMN", "IND", "IOT", "IRQ", "IRN", "ISL", "ITA", "JEY", "JAM", "JOR", "JPN", "KEN", "KGZ", "KHM", "KIR", "COM", "KNA", "PRK", "KOR", "KWT", "CYM", "KAZ", "LAO", "LBN", "LCA", "LIE", "LKA", "LBR", "LSO", "LTU", "LUX", "LVA", "LBY", "MAR", "MCO", "MDA", "MNE", "MAF", "MDG", "MHL", "MKD", "MLI", "MMR", "MNG", "MAC", "MNP", "MTQ", "MRT", "MSR", "MLT", "MUS", "MDV", "MWI", "MEX", "MYS", "MOZ", "NAM", "NCL", "NER", "NFK", "NGA", "NIC", "NLD", "NOR", "NPL", "NRU", "NIU", "NZL", "OMN", "PAN", "PER", "PYF", "PNG", "PHL", "PAK", "POL", "SPM", "PCN", "PRI", "PSE", "PRT", "PLW", "PRY", "QAT", "REU", "ROU", "SRB", "RUS", "RWA", "SAU", "SLB", "SYC", "SDN", "SWE", "SGP", "SHN", "SVN", "SJM", "SVK", "SLE", "SMR", "SEN", "SOM", "SUR", "SSD", "STP", "SLV", "SXM", "SYR", "SWZ", "TCA", "TCD", "ATF", "TGO", "THA", "TJK", "TKL", "TLS", "TKM", "TUN", "TON", "TUR", "TTO", "TUV", "TWN", "TZA", "UKR", "UGA", "UMI", "USA", "URY", "UZB", "VAT", "VCT", "VEN", "VGB", "VIR", "VNM", "VUT", "WLF", "WSM", "XKX", "YEM", "MYT", "ZAF", "ZMB", "ZWE"]); // warning: german passport has "D" instead of "DEU", so a mapping must be created
export const ageGroupEnum = pgEnum("age_group", ["8-15", "16-24", "25-34", "35-44", "45-54", "55-64", "65+"]);
export const sexEnum = pgEnum("sex", ["F", "M", "X"]);


// One user == one account.
// Inserting a record in that table means that the user has been successfully registered.
// To one user can be associated multiple validated emails and devices.
// Emails and devices must only be associated with exactly one user.
// The association between users and devices/emails can change over time.
// A user must have at least 1 validated primary email and 1 device associated with it.
// The "at least one" conditon is not enforced directly in the SQL model yet. It is done in the application code.
export const userTable = pgTable("user", {
    id: uuid("id").primaryKey(), // enforce the same key for the user in the frontend across email changes
    citizenId: integer("citizen_id").references(() => citizenTable.id).unique(), // strictly one of them is null => add check
    postCreatorId: integer("post_creator_id").references(() => postCreatorTable.id).unique(),
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

// post creators can initiate consultations
// they are known public individuals or organizations
// they cannot comment, respond to polls or vote
// they are not expected to verify ID with Rarimo
// currently post creator are invited by email address. They are personally known to us.
// they cannot be citizens at the same time
export const postCreatorTable = pgTable("post_creator", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references((): AnyPgColumn => userTable.id).unique().notNull(),
    name: varchar("name", { length: MAX_LENGTH_NAME_CREATOR }).notNull(),
    pictureUrl: text("picture_url"),
    websiteUrl: text("website_url"),
    description: varchar("description", { length: MAX_LENGTH_DESCRIPTION_CREATOR }),
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

// citizens are anonymous
// they can comment, respond to polls and vote
// they cannot initiate consultations
// they cannot be post creators at the same time
// after verifying ID => citizen demographic attributes are set
export const citizenTable = pgTable("citizen", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references((): AnyPgColumn => userTable.id).unique().notNull(),
    citizenships: countryCodeEnum("citizenships").array(), // holds TCountryCode
    ageGroup: ageGroupEnum("age_group"),
    sex: sexEnum("sex"),
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

export const deviceTable = pgTable("device", {
    didWrite: varchar("did_write", { length: 1000 }).primaryKey(), // TODO: make sure of length
    userId: uuid("user_id")
        .references(() => userTable.id)
        .notNull(),
    idProofId: integer("id_proof_id").references(() => idProofTable.id), // if null, then the corresponding user is not a citizen or the pub key hasn't been associated with an id proof yet
    userAgent: text("user_agent").notNull(), // user-agent length is not fixed
    // TODO: isTrusted: boolean("is_trusted").notNull(), // if set to true by user then, device should stay logged-in indefinitely until log out action
    sessionExpiry: timestamp("session_expiry").notNull(), // on register, a new login session is always started, hence the notNull. This column is updated to now + 15 minutes at each request when isTrusted == false. Otherwise, expiry will be now + 1000 years - meaning no expiry.
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

export const proofType = pgEnum("proof_type", [
    "root", // proof of passport from rarimo - may be associated with multiple pub keys
    "delegation", // ucan - delegates rights to potentially multiple other pub keys
]);

// each proof corresponds to at least one device
export const idProofTable = pgTable("id_proof", {
    id: serial("id").primaryKey(),
    citizenId: integer("citizen_id")
        .references(() => citizenTable.id)
        .notNull(),
    proofType: proofType("proof_type").notNull(),
    proof: text("proof").notNull(), // base64 encoded proof - rarimo proof if root, else delegation proof
    proofVersion: integer("proof_version").notNull(),
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
    userAgent: text("user_agent").notNull(), // user-agent length is not fixed
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


// conceptually, it is a "pollContentTable"
export const pollTable = pgTable("poll", {
    id: serial("id").primaryKey(),
    postContentId: integer("post_content_id")
        .notNull()
        .unique()
        .references(() => postContentTable.id),
    option1: varchar("option1", { length: MAX_LENGTH_OPTION }).notNull(),
    option2: varchar("option2", { length: MAX_LENGTH_OPTION }).notNull(),
    option3: varchar("option3", { length: MAX_LENGTH_OPTION }),
    option4: varchar("option4", { length: MAX_LENGTH_OPTION }),
    option5: varchar("option5", { length: MAX_LENGTH_OPTION }),
    option6: varchar("option6", { length: MAX_LENGTH_OPTION }),
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

export const proofTypeEnum = pgEnum("proof_type", ["creation", "edit", "deletion"]);

// these proofs are kept even after edit/deletion
export const postProofTable = pgTable("post_proof", {
    id: serial("id").primaryKey(),
    type: proofTypeEnum("proof_type").notNull(),
    postId: integer("post_id") // "postAs"
        .notNull()
        .references(() => postTable.id),
    postContentId: integer("post_content_id").unique()
        .references((): AnyPgColumn => postContentTable.id), // null if deletion proof and for creation and edit proofs if posts were deleted
    authorDid: varchar("author_did", { length: 1000 }) // TODO: make sure of length
        .notNull()
        .references(() => deviceTable.didWrite),
    proof: text("proof").notNull(), // base64 encoded proof
    proofVersion: integer("proof_version").notNull(),
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

export const postContentTable = pgTable("post_content", {
    id: serial("id").primaryKey(),
    postId: integer("post_id") // "postAs"
        .notNull()
        .references((): AnyPgColumn => postTable.id), // the author of the poll
    postProofId: integer("post_proof_id")
        .notNull()
        .unique()
        .references(() => postProofTable.id), // cannot point to deletion proof
    parentId: integer("parent_id").references((): AnyPgColumn => postContentTable.id), // not null if edit
    title: varchar("title", { length: MAX_LENGTH_TITLE }).notNull(),
    body: varchar("body", { length: MAX_LENGTH_BODY }),
    pollId: integer("poll_id").references((): AnyPgColumn => pollTable.id), // for now there is only one poll per post at most
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

export const postTable = pgTable("post", {
    id: serial("id").primaryKey(),
    slugId: varchar("slug_id", { length: 10 }).notNull(), // used for permanent URL
    authorId: uuid("author_id") // "postAs"
        .notNull()
        .references(() => userTable.id), // the author of the poll
    currentContentId: integer("current_content_id").references((): AnyPgColumn => postContentTable.id).unique(), // null if post was deleted
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
    authorId: uuid("author_id")
        .notNull()
        .references(() => userTable.id),
    postId: integer("post_id") // poll is bound to the post
        .notNull()
        .unique()
        .references(() => postTable.id),
    currentContent: integer("current_content_id").references((): AnyPgColumn => pollResponseContentTable.id).unique(), // not null if not deleted, else null
    // only there for read-speed
    option1Response: integer("option1_response").default(0).notNull(),
    option2Response: integer("option2_response").default(0).notNull(),
    option3Response: integer("option3_response"),
    option4Response: integer("option4_response"),
    option5Response: integer("option5_response"),
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

export const pollResponseProofTable = pgTable("poll_response_proof", {
    id: serial("id").primaryKey(),
    type: proofTypeEnum("proof_type").notNull(),
    pollResponseId: integer("poll_response_id") //
        .notNull()
        .references(() => pollResponseTable.id),
    authorDid: varchar("author_did", { length: 1000 }) // TODO: make sure of length
        .notNull()
        .references(() => deviceTable.didWrite),
    pollResponseContentId: integer("poll_response_content_id").unique()
        .references((): AnyPgColumn => pollResponseContentTable.id), // null if deletion proof and for creation and edit proofs if posts were deleted
    postProofId: integer("post_proof_id").references(() => postProofTable.id).notNull(), // exact post proof (post state which contains poll) to which this response proof corresponds.
    proof: text("proof").notNull(), // base64 encoded proof
    proofVersion: integer("proof_version").notNull(),
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

export const pollResponseContentTable = pgTable("poll_response_content", {
    id: serial("id").primaryKey(),
    pollResponseId: integer("poll_response_id") //
        .notNull()
        .references(() => pollResponseTable.id),
    pollResponseProofId: integer("poll_response_proof_id").notNull().unique().references((): AnyPgColumn => pollResponseProofTable.id),
    postContentId: integer("post_content_id").references(() => postContentTable.id), // exact post content and associated poll that existed when this poll was responded.  Null if post was deleted.
    parentId: integer("parent_id").references((): AnyPgColumn => pollResponseContentTable.id), // not null if edit
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
    authorId: uuid("author_id")
        .notNull()
        .references(() => userTable.id),
    postId: integer("post_id")
        .references(() => postTable.id)
        .unique()
        .notNull(),
    currentContentId: integer("current_content_id").references((): AnyPgColumn => commentContentTable.id), // null if comment was deleted
    likes: integer("likes").notNull().default(0),
    dislikes: integer("dislikes").notNull().default(0),
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
});

export const commentContentTable = pgTable("commentContent", {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id") // "postAs"
        .notNull()
        .references((): AnyPgColumn => commentTable.id), // the author of the poll
    commentProofId: integer("comment_proof_id")
        .notNull()
        .references(() => commentProofTable.id), // cannot point to deletion proof
    postContentId: integer("post_content_id").references(() => postContentTable.id), // exact post content that existed when this comment was created.  Null if post was deleted.
    parentId: integer("parent_id").references((): AnyPgColumn => commentContentTable.id), // not null if edit
    content: varchar("content", { length: MAX_LENGTH_COMMENT }).notNull(),
    toxicity: real("toxicity").notNull().default(0),
    severeToxicity: real("severe_toxicity").notNull().default(0),
    obscene: real("obscene").notNull().default(0),
    identityAttack: real("identity_attack").notNull().default(0),
    insult: real("insult").notNull().default(0),
    threat: real("threat").notNull().default(0),
    sexualExplicit: real("sexual_explicit").notNull().default(0),
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

// these proofs are kept even after edit/deletion
export const commentProofTable = pgTable("comment_proof", {
    id: serial("id").primaryKey(),
    type: proofTypeEnum("proof_type").notNull(),
    commentId: integer("comment_id") // "postAs"
        .notNull()
        .references(() => commentTable.id),
    commentContentId: integer("comment_content_id") // "postAs"
        .references((): AnyPgColumn => commentContentTable.id), // null if deletion proof and for creation and edit proofs if posts were deleted
    authorDid: varchar("author_did", { length: 1000 }) // TODO: make sure of length
        .notNull()
        .references(() => deviceTable.didWrite),
    postProofId: integer("post_proof_id").references(() => postProofTable.id).notNull(), // exact post proof (post state) to which this comment proof responded to.
    proof: text("proof").notNull(), // base64 encoded proof
    proofVersion: integer("proof_version").notNull(),
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

// like or dislike on comments for each user
export const voteTable = pgTable("vote", {
    id: serial("id").primaryKey(),
    authorId: uuid("author_id")
        .notNull()
        .references(() => userTable.id),
    commentId: integer("comment_id")
        .notNull()
        .references(() => commentTable.id),
    currentContent: integer("current_content_id").references((): AnyPgColumn => voteContentTable.id), // not null if not deleted, else null
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

export const voteEnum = pgEnum("vote_enum", ["like", "dislike"]);

export const voteContentTable = pgTable("vote_content", {
    id: serial("id").primaryKey(),
    voteId: integer("vote_id") //
        .notNull()
        .references(() => voteTable.id),
    voteProofId: integer("vote_proof_id").notNull().references((): AnyPgColumn => voteProofTable.id),
    commentContentId: integer("comment_content_id").references(() => commentContentTable.id), // exact comment content that existed when this vote was cast.  Null if comment was deleted.
    parentId: integer("parent_id").references((): AnyPgColumn => voteContentTable.id), // not null if edit
    optionChosen: voteEnum("option_chosen").notNull(),
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

export const voteProofTable = pgTable("vote_proof", {
    id: serial("id").primaryKey(),
    type: proofTypeEnum("proof_type").notNull(),
    voteId: integer("vote_id") //
        .notNull()
        .references(() => voteTable.id),
    voteContentId: integer("vote_content_id")
        .references((): AnyPgColumn => voteContentTable.id), // null if deletion proof and for creation and edit proofs if posts were deleted
    authorDid: varchar("author_did", { length: 1000 }) // TODO: make sure of length
        .notNull()
        .references(() => deviceTable.didWrite),
    commentProofId: integer("comment_proof_id").references(() => commentProofTable.id).notNull(), // exact comment proof (comment state) to which this vote proof responded to.
    proof: text("proof").notNull(), // base64 encoded proof
    proofVersion: integer("proof_version").notNull(),
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

// anti-social = hate + harassment + trolling + intelorance
// illegal = glaring violation of law (scam, terrorism, threat, etc)
const [firstReason, restReason] = ["irrelevant", "spam", "misinformation", "privacy", "sexual", "anti-social", "illegal", "other"]
export const reportReasonEnum = pgEnum("report_reason_enum", [firstReason, ...restReason]);
const restModeration = [...restReason, "nothing"]
export const moderationReasonEnum = pgEnum("moderation_reason_enum", [firstReason, ...restModeration]);

// todo: add suspend and ban
export const moderationAction = pgEnum("moderation_action", ["hide", "nothing"]);

export const reportTable = pgTable("report_table", {
    id: serial("id").primaryKey(),
    postId: integer("post_id") //
        .references(() => postTable.id), // at least one or the other should be not null - add a check
    commentId: integer("post_id") //
        .references(() => postTable.id), // at least one or the other should be not null - add a check
    reporterId: uuid("reporter_id").references(() => userTable.id), // null if reported by AI
    reportReason: reportReasonEnum("reporter_reason").notNull(),
    reportExplanation: varchar("report_explanation", { length: MAX_LENGTH_BODY }),
    moderationId: integer("moderation_id").references(() => moderationTable.id),
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

export const moderationTable = pgTable("moderation_table", {
    id: serial("id").primaryKey(),
    reportId: integer("report_id").notNull().references((): AnyPgColumn => reportTable.id),
    moderatorId: uuid("moderator_id").references(() => userTable.id),
    moderationAction: moderationAction("moderation_action").notNull(), // add check
    moderationReason: moderationReasonEnum("moderation_reason").notNull(), // add check: if not nothing above, must not be nothing here
    moderationExplanation: varchar("moderation_explanation", { length: MAX_LENGTH_BODY }),
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