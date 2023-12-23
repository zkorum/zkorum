CREATE UNIQUE INDEX IF NOT EXISTS "cred_em_unique_email_not_revoked" ON "credential_email" ("email") WHERE is_revoked = FALSE;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cred_fo_unique_email_not_revoked" ON "credential_form" ("email") WHERE is_revoked = FALSE;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cred_se_unique_user_id_not_revoked" ON "credential_secret" ("user_id","type") WHERE is_revoked = FALSE;
