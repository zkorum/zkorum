DO $$ BEGIN
 CREATE TYPE "auth_type" AS ENUM('register', 'login_known_device', 'login_new_device');
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
CREATE TABLE IF NOT EXISTS "auth_attempt" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"type" "auth_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"did_exchange" varchar(1000) NOT NULL,
	"user_id" uuid NOT NULL,
	"is_trusted" boolean NOT NULL,
	"session_expiry" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_did_exchange_unique" UNIQUE("did_exchange")
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
CREATE TABLE IF NOT EXISTS "login_known_device_attempt" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"user_id" uuid NOT NULL,
	"did_exchange" varchar(1000) NOT NULL,
	"is_trusted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_kd_otp_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"did_write" varchar(1000) NOT NULL,
	"email" varchar(254) NOT NULL,
	"code" char(6) NOT NULL,
	"code_expiry" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_new_device_attempt" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"user_id" uuid NOT NULL,
	"did_exchange" varchar(1000) NOT NULL,
	"is_trusted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_nd_otp_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"did_write" varchar(1000) NOT NULL,
	"email" varchar(254) NOT NULL,
	"code" char(6) NOT NULL,
	"code_expiry" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "register_attempt" (
	"did_write" varchar(1000) PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"user_id" uuid NOT NULL,
	"did_exchange" varchar(1000) NOT NULL,
	"is_trusted" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "register_otp_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"did_write" varchar(1000) NOT NULL,
	"code" char(6) NOT NULL,
	"code_expiry" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uid" char(16) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "login_known_device_attempt" ADD CONSTRAINT "login_known_device_attempt_did_write_device_did_write_fk" FOREIGN KEY ("did_write") REFERENCES "device"("did_write") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_known_device_attempt" ADD CONSTRAINT "login_known_device_attempt_email_email_email_fk" FOREIGN KEY ("email") REFERENCES "email"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_known_device_attempt" ADD CONSTRAINT "login_known_device_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_known_device_attempt" ADD CONSTRAINT "login_known_device_attempt_did_exchange_device_did_exchange_fk" FOREIGN KEY ("did_exchange") REFERENCES "device"("did_exchange") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_kd_otp_email" ADD CONSTRAINT "login_kd_otp_email_did_write_login_known_device_attempt_did_write_fk" FOREIGN KEY ("did_write") REFERENCES "login_known_device_attempt"("did_write") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_kd_otp_email" ADD CONSTRAINT "login_kd_otp_email_email_email_email_fk" FOREIGN KEY ("email") REFERENCES "email"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_new_device_attempt" ADD CONSTRAINT "login_new_device_attempt_email_email_email_fk" FOREIGN KEY ("email") REFERENCES "email"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_new_device_attempt" ADD CONSTRAINT "login_new_device_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_nd_otp_email" ADD CONSTRAINT "login_nd_otp_email_did_write_login_new_device_attempt_did_write_fk" FOREIGN KEY ("did_write") REFERENCES "login_new_device_attempt"("did_write") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_nd_otp_email" ADD CONSTRAINT "login_nd_otp_email_email_email_email_fk" FOREIGN KEY ("email") REFERENCES "email"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "register_otp_email" ADD CONSTRAINT "register_otp_email_did_write_register_attempt_did_write_fk" FOREIGN KEY ("did_write") REFERENCES "register_attempt"("did_write") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
