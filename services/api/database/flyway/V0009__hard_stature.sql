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
