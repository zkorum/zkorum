ALTER TABLE "poll" DROP COLUMN IF EXISTS "option1";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option1_response";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option2";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option2_response";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option3";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option3_response";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option4";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option4_response";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option5";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option5_response";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option6";--> statement-breakpoint
ALTER TABLE "poll" DROP COLUMN IF EXISTS "option6_response";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_poll_id_poll_options_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."poll_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_post_id_poll_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
