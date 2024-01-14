CREATE UNIQUE INDEX IF NOT EXISTS "unique_email_not_revoked" ON "credential_email" ("email") WHERE is_revoked = FALSE;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_email_not_revoked" ON "credential_form" ("email") WHERE is_revoked = FALSE;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_id_not_revoked" ON "credential_secret" ("user_id","type") WHERE is_revoked = FALSE;
