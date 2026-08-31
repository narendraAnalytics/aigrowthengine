CREATE TYPE "public"."assessment_email_kind" AS ENUM('team_alert', 'client_result');--> statement-breakpoint
CREATE TYPE "public"."assessment_email_status" AS ENUM('pending_approval', 'approved', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."narrative_source" AS ENUM('ai', 'templated');--> statement-breakpoint
CREATE TABLE "assessment_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"kind" "assessment_email_kind" NOT NULL,
	"status" "assessment_email_status" NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"body_hash" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"approved_hash" text,
	"sent_at" timestamp with time zone,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "solution_narrative" text;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD COLUMN "solution_narrative_source" "narrative_source";--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "contact_company" text;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "contact_note" text;--> statement-breakpoint
ALTER TABLE "assessment_emails" ADD CONSTRAINT "assessment_emails_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_emails_assessment_idx" ON "assessment_emails" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_emails_status_idx" ON "assessment_emails" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_emails_assessment_kind_uq" ON "assessment_emails" USING btree ("assessment_id","kind");