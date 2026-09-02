CREATE TYPE "public"."investor_email_kind" AS ENUM('confirmation', 'team_alert');--> statement-breakpoint
CREATE TYPE "public"."investor_email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."investor_geography" AS ENUM('india', 'apac', 'us', 'europe', 'global');--> statement-breakpoint
CREATE TYPE "public"."investor_request_status" AS ENUM('new', 'contacted', 'approved', 'declined');--> statement-breakpoint
CREATE TYPE "public"."investor_role" AS ENUM('founder', 'angel', 'vc', 'pe', 'corporate', 'family_office', 'other');--> statement-breakpoint
CREATE TYPE "public"."investor_stage" AS ENUM('pre_seed', 'seed', 'series_a_plus', 'growth', 'not_specified');--> statement-breakpoint
CREATE TABLE "investor_access_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" "investor_email_kind" NOT NULL,
	"status" "investor_email_status" NOT NULL,
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
CREATE TABLE "investor_interest_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"full_name" text NOT NULL,
	"work_email" text NOT NULL,
	"company" text NOT NULL,
	"role" "investor_role",
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stage" "investor_stage",
	"geography" "investor_geography",
	"learn_more" text,
	"status" "investor_request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "investor_access_emails" ADD CONSTRAINT "investor_access_emails_request_id_investor_interest_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."investor_interest_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "investor_access_emails_request_idx" ON "investor_access_emails" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "investor_access_emails_request_kind_uq" ON "investor_access_emails" USING btree ("request_id","kind");--> statement-breakpoint
CREATE INDEX "investor_interest_requests_status_idx" ON "investor_interest_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "investor_interest_requests_created_at_idx" ON "investor_interest_requests" USING btree ("created_at");