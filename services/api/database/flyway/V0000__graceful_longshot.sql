CREATE TYPE "public"."age_group" AS ENUM('8-15', '16-24', '25-34', '35-44', '45-54', '55-64', '65+');--> statement-breakpoint
CREATE TYPE "public"."auth_type" AS ENUM('register', 'login_known_device', 'login_new_device');--> statement-breakpoint
CREATE TYPE "public"."country_code" AS ENUM('AND', 'ARE', 'AFG', 'ATG', 'AIA', 'ALB', 'ARM', 'AGO', 'ATA', 'ARG', 'ASM', 'AUT', 'AUS', 'ABW', 'ALA', 'AZE', 'BIH', 'BRB', 'BGD', 'BEL', 'BFA', 'BGR', 'BHR', 'BDI', 'BEN', 'BLM', 'BMU', 'BRN', 'BOL', 'BES', 'BRA', 'BHS', 'BTN', 'BVT', 'BWA', 'BLR', 'BLZ', 'CAN', 'CCK', 'COD', 'CAF', 'COG', 'CHE', 'CIV', 'COK', 'CHL', 'CMR', 'CHN', 'COL', 'CRI', 'CUB', 'CPV', 'CUW', 'CXR', 'CYP', 'CZE', 'DEU', 'DJI', 'DNK', 'DMA', 'DOM', 'DZA', 'ECU', 'EST', 'EGY', 'ESH', 'ERI', 'ESP', 'ETH', 'FIN', 'FJI', 'FLK', 'FSM', 'FRO', 'FRA', 'GAB', 'GBR', 'GRD', 'GEO', 'GUF', 'GGY', 'GHA', 'GIB', 'GRL', 'GMB', 'GIN', 'GLP', 'GNQ', 'GRC', 'SGS', 'GTM', 'GUM', 'GNB', 'GUY', 'HKG', 'HMD', 'HND', 'HRV', 'HTI', 'HUN', 'IDN', 'IRL', 'ISR', 'IMN', 'IND', 'IOT', 'IRQ', 'IRN', 'ISL', 'ITA', 'JEY', 'JAM', 'JOR', 'JPN', 'KEN', 'KGZ', 'KHM', 'KIR', 'COM', 'KNA', 'PRK', 'KOR', 'KWT', 'CYM', 'KAZ', 'LAO', 'LBN', 'LCA', 'LIE', 'LKA', 'LBR', 'LSO', 'LTU', 'LUX', 'LVA', 'LBY', 'MAR', 'MCO', 'MDA', 'MNE', 'MAF', 'MDG', 'MHL', 'MKD', 'MLI', 'MMR', 'MNG', 'MAC', 'MNP', 'MTQ', 'MRT', 'MSR', 'MLT', 'MUS', 'MDV', 'MWI', 'MEX', 'MYS', 'MOZ', 'NAM', 'NCL', 'NER', 'NFK', 'NGA', 'NIC', 'NLD', 'NOR', 'NPL', 'NRU', 'NIU', 'NZL', 'OMN', 'PAN', 'PER', 'PYF', 'PNG', 'PHL', 'PAK', 'POL', 'SPM', 'PCN', 'PRI', 'PSE', 'PRT', 'PLW', 'PRY', 'QAT', 'REU', 'ROU', 'SRB', 'RUS', 'RWA', 'SAU', 'SLB', 'SYC', 'SDN', 'SWE', 'SGP', 'SHN', 'SVN', 'SJM', 'SVK', 'SLE', 'SMR', 'SEN', 'SOM', 'SUR', 'SSD', 'STP', 'SLV', 'SXM', 'SYR', 'SWZ', 'TCA', 'TCD', 'ATF', 'TGO', 'THA', 'TJK', 'TKL', 'TLS', 'TKM', 'TUN', 'TON', 'TUR', 'TTO', 'TUV', 'TWN', 'TZA', 'UKR', 'UGA', 'UMI', 'USA', 'URY', 'UZB', 'VAT', 'VCT', 'VEN', 'VGB', 'VIR', 'VNM', 'VUT', 'WLF', 'WSM', 'XKX', 'YEM', 'MYT', 'ZAF', 'ZMB', 'ZWE');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('primary', 'backup', 'secondary', 'other');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('hide', 'nothing');--> statement-breakpoint
CREATE TYPE "public"."moderation_reason_enum" AS ENUM('irrelevant', 's', 'p', 'a', 'm', 'nothing');--> statement-breakpoint
CREATE TYPE "public"."phone_country_code" AS ENUM('376', '971', '93', '1268', '1264', '355', '374', '244', '672', '54', '1684', '43', '297', '358', '994', '387', '1246', '880', '32', '226', '359', '973', '257', '229', '590', '1441', '673', '591', '5997', '55', '1242', '975', '47', '267', '375', '501', '1', '243', '236', '242', '41', '225', '682', '56', '237', '86', '57', '506', '53', '238', '5999', '61', '357', '420', '49', '253', '45', '1767', '1809', '1829', '1849', '213', '593', '372', '20', '212', '291', '34', '251', '679', '500', '691', '298', '33', '241', '1473', '995', '594', '233', '350', '299', '220', '224', '240', '30', '502', '1671', '245', '592', '852', '504', '385', '509', '36', '62', '353', '972', '91', '246', '964', '98', '354', '39', '44', '1876', '962', '81', '254', '996', '855', '686', '269', '1869', '850', '82', '965', '1345', '76', '77', '856', '961', '1758', '423', '94', '231', '266', '370', '352', '371', '218', '377', '373', '382', '261', '692', '389', '223', '95', '976', '853', '1670', '596', '222', '1664', '356', '230', '960', '265', '52', '60', '258', '264', '687', '227', '234', '505', '31', '977', '674', '683', '64', '968', '507', '51', '689', '675', '63', '92', '48', '508', '1787', '1939', '970', '351', '680', '595', '974', '262', '40', '381', '7', '250', '966', '677', '248', '249', '46', '65', '290', '386', '4779', '421', '232', '378', '221', '252', '597', '211', '239', '503', '1721', '963', '268', '1649', '235', '228', '66', '992', '690', '670', '993', '216', '676', '90', '1868', '688', '886', '255', '380', '256', '598', '998', '379', '1784', '58', '1284', '1340', '84', '678', '681', '685', '383', '967', '27', '260', '263');--> statement-breakpoint
CREATE TYPE "public"."proof_type" AS ENUM('creation', 'edit', 'deletion');--> statement-breakpoint
CREATE TYPE "public"."report_reason_enum" AS ENUM('irrelevant', 's', 'p', 'a', 'm');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('F', 'M', 'X');--> statement-breakpoint
CREATE TYPE "public"."vote_enum" AS ENUM('like', 'dislike');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_attempt" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"type" "auth_type" NOT NULL,
	"email" varchar(254) NOT NULL,
	"user_id" uuid NOT NULL,
	"user_agent" text NOT NULL,
	"code" integer NOT NULL,
	"code_expiry" timestamp NOT NULL,
	"guess_attempt_amount" integer DEFAULT 0 NOT NULL,
	"last_email_sent_at" timestamp NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment_content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comment_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"comment_id" integer NOT NULL,
	"comment_proof_id" integer NOT NULL,
	"post_content_id" integer,
	"parent_id" integer,
	"content" varchar(280) NOT NULL,
	"toxicity" real DEFAULT 0 NOT NULL,
	"severe_toxicity" real DEFAULT 0 NOT NULL,
	"obscene" real DEFAULT 0 NOT NULL,
	"identity_attack" real DEFAULT 0 NOT NULL,
	"insult" real DEFAULT 0 NOT NULL,
	"threat" real DEFAULT 0 NOT NULL,
	"sexual_explicit" real DEFAULT 0 NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug_id" varchar(6) NOT NULL,
	"author_id" uuid NOT NULL,
	"post_id" integer NOT NULL,
	"current_content_id" integer,
	"num_likes" integer DEFAULT 0 NOT NULL,
	"num_dislikes" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL,
	"last_reacted_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "comment_slug_id_unique" UNIQUE("slug_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"id_proof_id" integer,
	"user_agent" text NOT NULL,
	"session_expiry" timestamp NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email" (
	"email" varchar(254) PRIMARY KEY NOT NULL,
	"type" "email_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "id_proof" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "id_proof_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"proof_type" "proof_type" NOT NULL,
	"proof" text NOT NULL,
	"proof_version" integer NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "master_proof" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "master_proof_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"proof_type" "proof_type" NOT NULL,
	"author_did" varchar(1000) NOT NULL,
	"proof" text NOT NULL,
	"proof_version" integer NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_table" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "moderation_table_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"report_id" integer NOT NULL,
	"moderator_id" uuid,
	"moderation_action" "moderation_action" NOT NULL,
	"moderation_reason" "moderation_reason_enum" NOT NULL,
	"moderation_explanation" varchar(140),
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organisation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organisation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(65) NOT NULL,
	"image_url" text,
	"website_url" text,
	"description" varchar(280),
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passport" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "passport_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"citizenship" "country_code" NOT NULL,
	"age_group" "age_group",
	"sex" "sex",
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phone" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "phone_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"last_two_digits" varchar(2) NOT NULL,
	"phone_country_code" "phone_country_code" NOT NULL,
	"hashed_phone" text NOT NULL,
	"salt" text NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll_response_content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "poll_response_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"poll_response_id" integer NOT NULL,
	"poll_response_proof_id" integer NOT NULL,
	"post_content_id" integer,
	"parent_id" integer,
	"option_chosen" integer NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "poll_response_content_poll_response_proof_id_unique" UNIQUE("poll_response_proof_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll_response" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "poll_response_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"author_id" uuid NOT NULL,
	"post_id" integer NOT NULL,
	"current_content_id" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "poll_response_post_id_unique" UNIQUE("post_id"),
	CONSTRAINT "poll_response_current_content_id_unique" UNIQUE("current_content_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "poll_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_content_id" integer NOT NULL,
	"option1" varchar(30) NOT NULL,
	"option2" varchar(30) NOT NULL,
	"option3" varchar(30),
	"option4" varchar(30),
	"option5" varchar(30),
	"option6" varchar(30),
	"option1_response" integer DEFAULT 0 NOT NULL,
	"option2_response" integer DEFAULT 0 NOT NULL,
	"option3_response" integer,
	"option4_response" integer,
	"option5_response" integer,
	"option6_response" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "poll_post_content_id_unique" UNIQUE("post_content_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "post_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_proof_id" integer NOT NULL,
	"parent_id" integer,
	"title" varchar(65) NOT NULL,
	"body" varchar(140),
	"poll_id" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "post_content_post_proof_id_unique" UNIQUE("post_proof_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "post_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug_id" varchar(6) NOT NULL,
	"author_id" uuid NOT NULL,
	"current_content_id" integer NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL,
	"last_reacted_at" timestamp (0) DEFAULT now() NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "post_current_content_id_unique" UNIQUE("current_content_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_table" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "report_table_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_id" integer,
	"reporter_id" uuid,
	"reporter_reason" "report_reason_enum" NOT NULL,
	"report_explanation" varchar(140),
	"moderation_id" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organisation_id" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote_content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vote_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"vote_id" integer NOT NULL,
	"vote_proof_id" integer NOT NULL,
	"comment_content_id" integer,
	"parent_id" integer,
	"option_chosen" "vote_enum" NOT NULL,
	"created_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vote" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vote_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"author_id" uuid NOT NULL,
	"comment_id" integer NOT NULL,
	"current_content_id" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_content" ADD CONSTRAINT "comment_content_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_content" ADD CONSTRAINT "comment_content_comment_proof_id_master_proof_id_fk" FOREIGN KEY ("comment_proof_id") REFERENCES "public"."master_proof"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_content" ADD CONSTRAINT "comment_content_post_content_id_post_content_id_fk" FOREIGN KEY ("post_content_id") REFERENCES "public"."post_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment_content" ADD CONSTRAINT "comment_content_parent_id_comment_content_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comment_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_current_content_id_comment_content_id_fk" FOREIGN KEY ("current_content_id") REFERENCES "public"."comment_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device" ADD CONSTRAINT "device_id_proof_id_id_proof_id_fk" FOREIGN KEY ("id_proof_id") REFERENCES "public"."id_proof"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email" ADD CONSTRAINT "email_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "id_proof" ADD CONSTRAINT "id_proof_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "master_proof" ADD CONSTRAINT "master_proof_author_did_device_did_write_fk" FOREIGN KEY ("author_did") REFERENCES "public"."device"("did_write") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_table" ADD CONSTRAINT "moderation_table_report_id_report_table_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report_table"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "moderation_table" ADD CONSTRAINT "moderation_table_moderator_id_user_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passport" ADD CONSTRAINT "passport_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phone" ADD CONSTRAINT "phone_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response_content" ADD CONSTRAINT "poll_response_content_poll_response_id_poll_response_id_fk" FOREIGN KEY ("poll_response_id") REFERENCES "public"."poll_response"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response_content" ADD CONSTRAINT "poll_response_content_poll_response_proof_id_master_proof_id_fk" FOREIGN KEY ("poll_response_proof_id") REFERENCES "public"."master_proof"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response_content" ADD CONSTRAINT "poll_response_content_post_content_id_post_content_id_fk" FOREIGN KEY ("post_content_id") REFERENCES "public"."post_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response_content" ADD CONSTRAINT "poll_response_content_parent_id_poll_response_content_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."poll_response_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_current_content_id_poll_response_content_id_fk" FOREIGN KEY ("current_content_id") REFERENCES "public"."poll_response_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_post_content_id_post_content_id_fk" FOREIGN KEY ("post_content_id") REFERENCES "public"."post_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_content" ADD CONSTRAINT "post_content_post_proof_id_master_proof_id_fk" FOREIGN KEY ("post_proof_id") REFERENCES "public"."master_proof"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_content" ADD CONSTRAINT "post_content_parent_id_post_content_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."post_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_content" ADD CONSTRAINT "post_content_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_current_content_id_post_content_id_fk" FOREIGN KEY ("current_content_id") REFERENCES "public"."post_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_table" ADD CONSTRAINT "report_table_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_table" ADD CONSTRAINT "report_table_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_table" ADD CONSTRAINT "report_table_moderation_id_moderation_table_id_fk" FOREIGN KEY ("moderation_id") REFERENCES "public"."moderation_table"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_content" ADD CONSTRAINT "vote_content_vote_id_vote_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."vote"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_content" ADD CONSTRAINT "vote_content_vote_proof_id_master_proof_id_fk" FOREIGN KEY ("vote_proof_id") REFERENCES "public"."master_proof"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_content" ADD CONSTRAINT "vote_content_comment_content_id_comment_content_id_fk" FOREIGN KEY ("comment_content_id") REFERENCES "public"."comment_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote_content" ADD CONSTRAINT "vote_content_parent_id_vote_content_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vote_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vote" ADD CONSTRAINT "vote_current_content_id_vote_content_id_fk" FOREIGN KEY ("current_content_id") REFERENCES "public"."vote_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
