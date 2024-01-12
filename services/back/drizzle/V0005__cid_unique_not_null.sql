ALTER TABLE "poll" ALTER COLUMN "pres_cid" ADD CONSTRAINT "poll_pres_cid_unique" UNIQUE ("pres_cid");--> statement-breakpoint
ALTER TABLE "poll" ALTER COLUMN "pres_cid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_response" ALTER COLUMN "pres_cid" ADD CONSTRAINT "poll_resp_pres_cid_unique" UNIQUE ("pres_cid");--> statement-breakpoint
ALTER TABLE "poll_response" ALTER COLUMN "pres_cid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "poll_response" ALTER COLUMN "time_pres_cid" ADD CONSTRAINT "poll_resp_time_pres_cid_unique" UNIQUE ("time_pres_cid");--> statement-breakpoint
ALTER TABLE "poll_response" ALTER COLUMN "time_pres_cid" SET NOT NULl;--> statement-breakpoint

