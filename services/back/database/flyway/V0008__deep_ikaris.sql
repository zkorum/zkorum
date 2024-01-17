ALTER TABLE "poll" ALTER COLUMN "slug_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "poll" ADD COLUMN "comment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "poll" ADD CONSTRAINT "poll_slug_id_unique" UNIQUE("slug_id");