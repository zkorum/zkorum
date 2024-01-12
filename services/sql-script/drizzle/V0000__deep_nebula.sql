DO $$ BEGIN
 CREATE TYPE "auth_type" AS ENUM('register', 'login_known_device', 'login_new_device');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "credential_type" AS ENUM('university', 'company');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "email_type" AS ENUM('primary', 'backup', 'secondary', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "credential_secret_type" AS ENUM('unbound', 'timebound');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "university_type" AS ENUM('student', 'alum', 'faculty');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alum_eligibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alum_persona" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_attempt" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"type" "auth_type" NOT NULL,
	"email" varchar(254) NOT NULL,
	"user_id" uuid NOT NULL,
	"did_exchange" varchar(1000) NOT NULL,
	"code" integer NOT NULL,
	"code_expiry" timestamp NOT NULL,
	"guess_attempt_amount" integer DEFAULT 0 NOT NULL,
	"last_email_sent_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"credential" jsonb NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"email" varchar(254) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential_form" (
	"id" serial PRIMARY KEY NOT NULL,
	"credential" jsonb NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"email" varchar(254) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credential_secret" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "credential_secret_type" NOT NULL,
	"credential" jsonb NOT NULL,
	"encrypted_blinding" text NOT NULL,
	"encrypted_blinded_subject" text NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"did_exchange" varchar(1000) NOT NULL,
	"user_id" uuid NOT NULL,
	"session_expiry" timestamp NOT NULL,
	"encrypted_symm_key" "bytea",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_did_exchange_unique" UNIQUE("did_exchange")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eligibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255)[],
	"type" credential_type[],
	"university_eligibility_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email" (
	"email" varchar(254) PRIMARY KEY NOT NULL,
	"type" "email_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculty_eligibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faculty_persona" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "persona" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL,
	"type" "credential_type" NOT NULL,
	"university_persona_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll_response" (
	"id" serial PRIMARY KEY NOT NULL,
	"presentation" jsonb NOT NULL,
	"author_id" integer NOT NULL,
	"poll_id" integer NOT NULL,
	"option_chosen" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poll" (
	"id" serial PRIMARY KEY NOT NULL,
	"presentation" jsonb NOT NULL,
	"time_pres_cid" char(61) NOT NULL,
	"author_id" integer NOT NULL,
	"eligibility_id" integer NOT NULL,
	"question" varchar(140) NOT NULL,
	"option1" varchar(30) NOT NULL,
	"option1_response" integer DEFAULT 0 NOT NULL,
	"option2" varchar(30) NOT NULL,
	"option2_response" integer DEFAULT 0 NOT NULL,
	"option3" varchar(30),
	"option3_response" integer,
	"option4" varchar(30),
	"option4_response" integer,
	"option5" varchar(30),
	"option5_response" integer,
	"option6" varchar(30),
	"option6_response" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "poll_time_pres_cid_unique" UNIQUE("time_pres_cid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pseudonym" (
	"id" serial PRIMARY KEY NOT NULL,
	"pseudonym" text NOT NULL,
	"persona_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pseudonym_pseudonym_unique" UNIQUE("pseudonym"),
	CONSTRAINT "pseudonym_persona_id_unique" UNIQUE("persona_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_eligibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"campus" varchar(255)[],
	"program" varchar(255)[],
	"admissionYear" integer[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_persona" (
	"id" serial PRIMARY KEY NOT NULL,
	"campus" varchar(255),
	"program" varchar(255),
	"admissionYear" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "university_eligibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"types" university_type[],
	"countries" char(2)[],
	"student_eligibility_id" integer,
	"alum_eligibility_id" integer,
	"faculty_eligibility_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "university_persona" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "university_type" NOT NULL,
	"countries" char(2)[],
	"student_persona_id" integer,
	"alum_persona_id" integer,
	"faculty_persona_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uid" char(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credential_email" ADD CONSTRAINT "credential_email_email_email_email_fk" FOREIGN KEY ("email") REFERENCES "email"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credential_form" ADD CONSTRAINT "credential_form_email_email_email_fk" FOREIGN KEY ("email") REFERENCES "email"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credential_secret" ADD CONSTRAINT "credential_secret_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eligibility" ADD CONSTRAINT "eligibility_university_eligibility_id_university_eligibility_id_fk" FOREIGN KEY ("university_eligibility_id") REFERENCES "university_eligibility"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email" ADD CONSTRAINT "email_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "persona" ADD CONSTRAINT "persona_university_persona_id_university_persona_id_fk" FOREIGN KEY ("university_persona_id") REFERENCES "university_persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_author_id_pseudonym_id_fk" FOREIGN KEY ("author_id") REFERENCES "pseudonym"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_author_id_pseudonym_id_fk" FOREIGN KEY ("author_id") REFERENCES "pseudonym"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_eligibility_id_eligibility_id_fk" FOREIGN KEY ("eligibility_id") REFERENCES "eligibility"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pseudonym" ADD CONSTRAINT "pseudonym_persona_id_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "university_eligibility" ADD CONSTRAINT "university_eligibility_student_eligibility_id_student_eligibility_id_fk" FOREIGN KEY ("student_eligibility_id") REFERENCES "student_eligibility"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "university_eligibility" ADD CONSTRAINT "university_eligibility_alum_eligibility_id_alum_eligibility_id_fk" FOREIGN KEY ("alum_eligibility_id") REFERENCES "alum_eligibility"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "university_eligibility" ADD CONSTRAINT "university_eligibility_faculty_eligibility_id_faculty_eligibility_id_fk" FOREIGN KEY ("faculty_eligibility_id") REFERENCES "faculty_eligibility"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "university_persona" ADD CONSTRAINT "university_persona_student_persona_id_student_persona_id_fk" FOREIGN KEY ("student_persona_id") REFERENCES "student_persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "university_persona" ADD CONSTRAINT "university_persona_alum_persona_id_alum_persona_id_fk" FOREIGN KEY ("alum_persona_id") REFERENCES "alum_persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "university_persona" ADD CONSTRAINT "university_persona_faculty_persona_id_faculty_persona_id_fk" FOREIGN KEY ("faculty_persona_id") REFERENCES "faculty_persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
