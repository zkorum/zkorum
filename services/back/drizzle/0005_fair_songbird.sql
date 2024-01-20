ALTER TABLE "poll" RENAME TO "post";--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "poll_slug_id_unique";--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "poll_pres_cid_unique";--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "poll_time_pres_cid_unique";--> statement-breakpoint
ALTER TABLE "comment" DROP CONSTRAINT "comment_post_id_poll_id_fk";
--> statement-breakpoint
ALTER TABLE "poll_options" DROP CONSTRAINT "poll_options_post_id_poll_id_fk";
--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "poll_author_id_pseudonym_id_fk";
--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "poll_eligibility_id_eligibility_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_author_id_pseudonym_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."pseudonym"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_eligibility_id_eligibility_id_fk" FOREIGN KEY ("eligibility_id") REFERENCES "public"."eligibility"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_slug_id_unique" UNIQUE("slug_id");--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_pres_cid_unique" UNIQUE("pres_cid");--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_time_pres_cid_unique" UNIQUE("time_pres_cid");