CREATE TYPE "public"."idea_assessment_status" AS ENUM('analyzing', 'scored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."idea_email_kind" AS ENUM('client_result', 'team_alert');--> statement-breakpoint
CREATE TYPE "public"."idea_email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."idea_score_band" AS ENUM('strong', 'promising', 'moderate', 'weak');--> statement-breakpoint
CREATE TYPE "public"."idea_verdict" AS ENUM('build', 'refine', 'validate', 'rethink');--> statement-breakpoint
CREATE TABLE "idea_assessment_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_assessment_id" uuid NOT NULL,
	"kind" "idea_email_kind" NOT NULL,
	"status" "idea_email_status" NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "idea_assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_assessment_id" uuid NOT NULL,
	"signals" jsonb NOT NULL,
	"potential_score" integer NOT NULL,
	"score_band" "idea_score_band" NOT NULL,
	"verdict" "idea_verdict" NOT NULL,
	"verdict_reason" text NOT NULL,
	"verdict_model_version" text NOT NULL,
	"summary" text,
	"main_risk" text,
	"ai_approaches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_path" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "idea_assessment_results_idea_assessment_id_unique" UNIQUE("idea_assessment_id")
);
--> statement-breakpoint
CREATE TABLE "idea_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"status" "idea_assessment_status" DEFAULT 'analyzing' NOT NULL,
	"answers" jsonb NOT NULL,
	"contact_email" text,
	"contact_name" text,
	"lead_name" text,
	"lead_company" text,
	"lead_phone" text,
	"lead_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "idea_assessment_emails" ADD CONSTRAINT "idea_assessment_emails_idea_assessment_id_idea_assessments_id_fk" FOREIGN KEY ("idea_assessment_id") REFERENCES "public"."idea_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_assessment_results" ADD CONSTRAINT "idea_assessment_results_idea_assessment_id_idea_assessments_id_fk" FOREIGN KEY ("idea_assessment_id") REFERENCES "public"."idea_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_assessments" ADD CONSTRAINT "idea_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_assessments" ADD CONSTRAINT "idea_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idea_assessment_emails_assessment_idx" ON "idea_assessment_emails" USING btree ("idea_assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idea_assessment_emails_assessment_kind_uq" ON "idea_assessment_emails" USING btree ("idea_assessment_id","kind");--> statement-breakpoint
CREATE INDEX "idea_assessments_user_idx" ON "idea_assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idea_assessments_organization_idx" ON "idea_assessments" USING btree ("organization_id");