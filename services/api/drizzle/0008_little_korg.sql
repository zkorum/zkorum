ALTER TABLE "auth_attempt" ADD COLUMN "user_agent" text DEFAULT 'Unknown device' NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "user_agent" text DEFAULT 'Unknown device' NOT NULL;
