ALTER TABLE "credential_email" ADD COLUMN "pk_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "credential_form" ADD COLUMN "pk_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "credential_secret" ADD COLUMN "pk_version" integer DEFAULT 1 NOT NULL;