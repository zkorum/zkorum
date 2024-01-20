ALTER TABLE "poll_options" RENAME TO "poll";--> statement-breakpoint
ALTER TABLE "poll" DROP CONSTRAINT "poll_options_post_id_unique";--> statement-breakpoint
ALTER TABLE "poll_response" DROP CONSTRAINT "poll_response_poll_id_poll_options_id_fk";
--> statement-breakpoint
ALTER TABLE "poll" DROP CONSTRAINT "poll_options_post_id_post_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_poll_id_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll" ADD CONSTRAINT "poll_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "poll" ADD CONSTRAINT "poll_post_id_unique" UNIQUE("post_id");