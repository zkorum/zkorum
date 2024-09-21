ALTER TABLE "comment" ALTER COLUMN "content" SET DATA TYPE varchar(6000);--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "title" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "body" SET DATA TYPE varchar(6000);