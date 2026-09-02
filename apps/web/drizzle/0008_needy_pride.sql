CREATE TYPE "public"."voice_call_email_kind" AS ENUM('confirmation', 'team_alert', 'team_summary');--> statement-breakpoint
CREATE TYPE "public"."voice_call_email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."voice_call_outcome" AS ENUM('interested', 'consultation_requested', 'callback_requested', 'not_interested', 'no_answer', 'completed_unclear');--> statement-breakpoint
CREATE TYPE "public"."voice_call_status" AS ENUM('pending', 'calling', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "voice_call_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" "voice_call_email_kind" NOT NULL,
	"status" "voice_call_email_status" NOT NULL,
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
CREATE TABLE "voice_call_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text,
	"full_name" text NOT NULL,
	"company" text,
	"phone_e164" text NOT NULL,
	"email" text,
	"requirement" text NOT NULL,
	"consent" boolean NOT NULL,
	"status" "voice_call_status" DEFAULT 'pending' NOT NULL,
	"outcome" "voice_call_outcome",
	"attempt_id" text,
	"call_status" text,
	"duration_seconds" integer,
	"transcript" jsonb,
	"summary" text,
	"error" text,
	"called_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "voice_call_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "voice_call_emails" ADD CONSTRAINT "voice_call_emails_request_id_voice_call_requests_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."voice_call_requests"("request_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "voice_call_emails_request_idx" ON "voice_call_emails" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_call_emails_request_kind_uq" ON "voice_call_emails" USING btree ("request_id","kind");--> statement-breakpoint
CREATE INDEX "voice_call_requests_status_idx" ON "voice_call_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "voice_call_requests_created_at_idx" ON "voice_call_requests" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_call_requests_request_id_uq" ON "voice_call_requests" USING btree ("request_id");