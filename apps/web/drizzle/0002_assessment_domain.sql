CREATE TYPE "public"."assessment_status" AS ENUM('submitted', 'analyzing', 'scored', 'needs_expert_review', 'failed');--> statement-breakpoint
CREATE TYPE "public"."expert_review_status" AS ENUM('open', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."match_class" AS ENUM('strong', 'partial', 'none');--> statement-breakpoint
CREATE TYPE "public"."score_band" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"problem_types" jsonb NOT NULL,
	"industry" text,
	"signals" jsonb NOT NULL,
	"lead_score" integer NOT NULL,
	"score_band" "score_band" NOT NULL,
	"scoring_model_version" text NOT NULL,
	"summary" text,
	"no_confident_match" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "assessment_results_assessment_id_unique" UNIQUE("assessment_id")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"status" "assessment_status" DEFAULT 'submitted' NOT NULL,
	"answers" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "capability_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_result_id" uuid NOT NULL,
	"capability_id" text NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"match_class" "match_class" NOT NULL,
	"rationale" text,
	"rank" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expert_review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"note" text,
	"status" "expert_review_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capability_matches" ADD CONSTRAINT "capability_matches_assessment_result_id_assessment_results_id_fk" FOREIGN KEY ("assessment_result_id") REFERENCES "public"."assessment_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_review_requests" ADD CONSTRAINT "expert_review_requests_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_review_requests" ADD CONSTRAINT "expert_review_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_review_requests" ADD CONSTRAINT "expert_review_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessments_user_idx" ON "assessments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assessments_organization_idx" ON "assessments" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "capability_matches_result_capability_uq" ON "capability_matches" USING btree ("assessment_result_id","capability_id");--> statement-breakpoint
CREATE INDEX "capability_matches_capability_idx" ON "capability_matches" USING btree ("capability_id");--> statement-breakpoint
CREATE INDEX "expert_review_requests_status_idx" ON "expert_review_requests" USING btree ("status");