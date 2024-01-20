CREATE TABLE IF NOT EXISTS "poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"option1" varchar(30) NOT NULL,
	"option1_response" integer DEFAULT 0 NOT NULL,
	"option2" varchar(30) NOT NULL,
	"option2_response" integer DEFAULT 0 NOT NULL,
	"option3" varchar(30),
	"option3_response" integer,
	"option4" varchar(30),
	"option4_response" integer,
	"option5" varchar(30),
	"option5_response" integer,
	"option6" varchar(30),
	"option6_response" integer,
	"created_at" timestamp (0) DEFAULT now() NOT NULL,
	"updated_at" timestamp (0) DEFAULT now() NOT NULL,
	CONSTRAINT "poll_options_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
ALTER TABLE "poll" RENAME COLUMN "question" TO "title";--> statement-breakpoint
ALTER TABLE "poll_response" DROP CONSTRAINT "poll_response_poll_id_poll_id_fk";
--> statement-breakpoint
ALTER TABLE "poll" ADD COLUMN "body" varchar(3000);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "poll_response" ADD CONSTRAINT "poll_response_poll_id_poll_options_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."poll_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
 ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_post_id_poll_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."poll"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
