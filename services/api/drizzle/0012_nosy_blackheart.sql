ALTER TABLE "comment" ADD COLUMN "rewrite_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "toxicity" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "severe_toxicity" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "obscene" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "identity_attack" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "insult" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "threat" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "sexual_explicit" real DEFAULT 0 NOT NULL;