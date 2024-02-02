ALTER TABLE "persona" DROP CONSTRAINT "persona_university_persona_id_university_persona_id_fk";
ALTER TABLE "post" DROP CONSTRAINT "post_eligibility_id_eligibility_id_fk";
ALTER TABLE "persona" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "persona" DROP COLUMN IF EXISTS "university_persona_id";--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN IF EXISTS "eligibility_id";
DROP TABLE "eligibility";--> statement-breakpoint
DROP TABLE "university_eligibility";--> statement-breakpoint
DROP TABLE "faculty_eligibility";--> statement-breakpoint
DROP TABLE "student_eligibility";--> statement-breakpoint
DROP TABLE "alum_eligibility";--> statement-breakpoint
DROP TABLE "university_persona";--> statement-breakpoint
DROP TABLE "alum_persona";--> statement-breakpoint
DROP TABLE "faculty_persona";--> statement-breakpoint
DROP TABLE "student_persona";--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
