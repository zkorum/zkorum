import {
    pgEnum,
    pgTable,
    timestamp,
    uuid,
    varchar,
    integer,
    boolean,
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

export const phoneCountryCodeEnum = pgEnum("phone_country_code", [
    "376", "971", "93", "1268", "1264", "355", "374", "244", "672", "54", "1684", "43", "297", "358", "994", "387", "1246",
    "880", "32", "226", "359", "973", "257", "229", "590", "1441", "673", "591", "5997", "55", "1242", "975", "47", "267", "375",
    "501", "1", "243", "236", "242", "41", "225", "682", "56", "237", "86", "57", "506", "53", "238", "5999", "61", "357",
    "420", "49", "253", "45", "1767", "1809", "1829", "1849", "213", "593", "372", "20", "212", "291", "34", "251", "679",
    "500", "691", "298", "33", "241", "1473", "995", "594", "233", "350", "299", "220", "224", "240", "30",
    "502", "1671", "245", "592", "852", "504", "385", "509", "36", "62", "353", "972", "91", "246", "964",
    "98", "354", "39", "44", "1876", "962", "81", "254", "996", "855", "686", "269", "1869", "850", "82", "965", "1345", "76",
    "77", "856", "961", "1758", "423", "94", "231", "266", "370", "352", "371", "218", "377", "373", "382", "261",
    "692", "389", "223", "95", "976", "853", "1670", "596", "222", "1664", "356", "230", "960", "265", "52", "60", "258", "264",
    "687", "227", "234", "505", "31", "977", "674", "683", "64", "968", "507", "51", "689", "675", "63", "92",
    "48", "508", "1787", "1939", "970", "351", "680", "595", "974", "262", "40", "381", "7", "250", "966", "677", "248",
    "249", "46", "65", "290", "386", "4779", "421", "232", "378", "221", "252", "597", "211", "239", "503", "1721", "963",
    "268", "1649", "235", "228", "66", "992", "690", "670", "993", "216", "676", "90", "1868", "688", "886", "255",
    "380", "256", "598", "998", "379", "1784", "58", "1284", "1340", "84", "678", "681", "685", "383",
    "967", "27", "260", "263"
]);

// One user == one account.
// Inserting a record in that table means that the user has been successfully registered.
// To one user can be associated multiple validated emails and devices.
// Emails and devices must only be associated with exactly one user.
// The association between users and devices/emails can change over time.
// A user must have at least 1 validated primary email and 1 device associated with it.
// The "at least one" conditon is not enforced directly in the SQL model yet. It is done in the application code.
export const userTable = pgTable("user", {
    id: uuid("id").primaryKey(), // enforce the same key for the user in the frontend across email changes
    organisationId: integer("organisation_id").references(() => organisationTable.id), // for now a user can belong to at most 1 organisation
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

export const organisationTable = pgTable("organisation", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: MAX_LENGTH_NAME_CREATOR }).notNull(),
    imageUrl: text("image_url"),
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

export const passportTable = pgTable("passport", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
        .references(() => userTable.id)
        .notNull(),
    citizenship: countryCodeEnum("citizenship").notNull(), // holds TCountryCode
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

export const phoneTable = pgTable("phone", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
        .references(() => userTable.id)
        .notNull(),
    lastTwoDigits: varchar("last_two_digits", { length: 2 }).notNull(), // add check for it to be numbers?
    phoneCountryCode: phoneCountryCodeEnum("phone_country_code").notNull(),
    hashedPhone: text("hashed_phone").notNull(), // base64 encoded hash of phone + salt
    salt: text("salt").notNull(), // base64 encoded salt, might change the type
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
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
        .references(() => userTable.id)
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
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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

export const proofTypeEnum = pgEnum("proof_type", ["creation", "edit", "deletion"]);

export const masterProofTable = pgTable("master_proof", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    type: proofTypeEnum("proof_type").notNull(),
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
});

export const postContentTable = pgTable("post_content", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postProofId: integer("post_proof_id")
        .notNull()
        .unique()
        .references(() => masterProofTable.id), // cannot point to deletion proof
    parentId: integer("parent_id").references((): AnyPgColumn => postContentTable.id), // not null if edit
    title: varchar("title", { length: MAX_LENGTH_TITLE }).notNull(),
    body: varchar("body", { length: MAX_LENGTH_BODY }),
    pollId: integer("poll_id").references((): AnyPgColumn => pollTable.id), // for now there is only one poll per post at most
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull()
});

export const postTable = pgTable("post", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slugId: varchar("slug_id", { length: 6 }).notNull(), // used for permanent URL
    authorId: uuid("author_id") // "postAs"
        .notNull()
        .references(() => userTable.id), // the author of the poll
    currentContentId: integer("current_content_id").references((): AnyPgColumn => postContentTable.id).unique().notNull(), // null if post was deleted
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
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    authorId: uuid("author_id")
        .notNull()
        .references(() => userTable.id),
    postId: integer("post_id") // poll is bound to the post
        .notNull()
        .unique()
        .references(() => postTable.id),
    currentContentId: integer("current_content_id").references((): AnyPgColumn => pollResponseContentTable.id).unique(), // not null if not deleted, else null
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
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    pollResponseId: integer("poll_response_id") //
        .notNull()
        .references(() => pollResponseTable.id),
    pollResponseProofId: integer("poll_response_proof_id").notNull().unique().references((): AnyPgColumn => masterProofTable.id),
    postContentId: integer("post_content_id").references(() => postContentTable.id), // exact post content and associated poll that existed when this poll was responded.  Null if post was deleted.
    parentId: integer("parent_id").references((): AnyPgColumn => pollResponseContentTable.id), // not null if edit
    optionChosen: integer("option_chosen").notNull(),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull()
});

export const commentTable = pgTable("comment", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    slugId: varchar("slug_id", { length: 6 }).notNull().unique(), // used for permanent URL
    authorId: uuid("author_id")
        .notNull()
        .references(() => userTable.id),
    postId: integer("post_id")
        .references(() => postTable.id)
        .notNull(),
    currentContentId: integer("current_content_id").references((): AnyPgColumn => commentContentTable.id), // null if comment was deleted
    numLikes: integer("num_likes").notNull().default(0),
    numDislikes: integer("num_dislikes").notNull().default(0),
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

export const commentContentTable = pgTable("comment_content", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    commentId: integer("comment_id") // "postAs"
        .notNull()
        .references((): AnyPgColumn => commentTable.id), // the author of the poll
    commentProofId: integer("comment_proof_id")
        .notNull()
        .references(() => masterProofTable.id), // cannot point to deletion proof
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

// like or dislike on comments for each user
export const voteTable = pgTable("vote", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    authorId: uuid("author_id")
        .notNull()
        .references(() => userTable.id),
    commentId: integer("comment_id")
        .notNull()
        .references(() => commentTable.id),
    currentContentId: integer("current_content_id").references((): AnyPgColumn => voteContentTable.id), // not null if not deleted, else null
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
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    voteId: integer("vote_id") //
        .notNull()
        .references(() => voteTable.id),
    voteProofId: integer("vote_proof_id").notNull().references((): AnyPgColumn => masterProofTable.id),
    commentContentId: integer("comment_content_id").references(() => commentContentTable.id), // exact comment content that existed when this vote was cast.  Null if comment was deleted.
    parentId: integer("parent_id").references((): AnyPgColumn => voteContentTable.id), // not null if edit
    optionChosen: voteEnum("option_chosen").notNull(),
    createdAt: timestamp("created_at", {
        mode: "date",
        precision: 0,
    })
        .defaultNow()
        .notNull()
});

// anti-social = hate + harassment + trolling + intelorance
// illegal = glaring violation of law (scam, terrorism, threat, etc)
const [firstReason, restReason] = ["irrelevant", "spam", "misinformation", "privacy", "sexual", "anti-social", "illegal", "other"];
export const reportReasonEnum = pgEnum("report_reason_enum", [firstReason, ...restReason]);
const restModeration = [...restReason, "nothing"];
export const moderationReasonEnum = pgEnum("moderation_reason_enum", [firstReason, ...restModeration]);

// todo: add suspend and ban
export const moderationAction = pgEnum("moderation_action", ["hide", "nothing"]);

export const reportTable = pgTable("report_table", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
