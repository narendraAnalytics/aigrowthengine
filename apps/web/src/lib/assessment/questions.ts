import { INDUSTRIES } from "@/lib/capabilities/schema";

/**
 * The assessment intake questions (Phase 0, PRD 0.1).
 *
 * A business describes a problem in plain language; these questions collect just
 * enough structured context for the classifier + matcher to work and for the
 * lead-scoring function (Phase 0.3, deterministic + versioned) to have real
 * inputs. Keep this list short — every extra field costs completion rate.
 *
 * Copy here is a DRAFT for review, not final marketing-approved wording.
 */

export type AssessmentQuestionType =
  | "long_text"
  | "short_text"
  | "single_select"
  | "multi_select";

export type AssessmentQuestion = {
  id: string;
  type: AssessmentQuestionType;
  label: string;
  helpText?: string;
  required: boolean;
  /** For select types. */
  options?: { value: string; label: string }[];
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "problem_description",
    type: "long_text",
    label:
      "In a few sentences, describe the business problem or process you'd like to improve.",
    helpText: "Plain language is fine — no need to mention AI or technology.",
    required: true,
  },
  {
    id: "business_function",
    type: "single_select",
    label: "Which part of the business does this sit in?",
    required: true,
    options: [
      { value: "operations_supply_chain", label: "Operations / Supply chain" },
      { value: "finance_accounts", label: "Finance / Accounts" },
      { value: "customer_service", label: "Customer service / Support" },
      { value: "sales_marketing", label: "Sales / Marketing" },
      { value: "hr_admin", label: "HR / Admin" },
      { value: "it_security", label: "IT / Security" },
      { value: "legal_compliance", label: "Legal / Compliance" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "current_cost",
    type: "short_text",
    label:
      "Roughly how much time or money does this consume today? (best estimate)",
    helpText: "e.g. \"~120 hours/week across 4 people\" or \"₹6 lakh/month\".",
    required: true,
  },
  {
    id: "how_handled_now",
    type: "single_select",
    label: "How is it handled now?",
    required: true,
    options: [
      { value: "manual", label: "Manually / by hand" },
      { value: "spreadsheets", label: "Spreadsheets" },
      { value: "existing_tool", label: "An existing software tool" },
      { value: "outsourced", label: "Outsourced to a vendor" },
      { value: "not_handled", label: "Not really handled today" },
    ],
  },
  {
    id: "systems_involved",
    type: "short_text",
    label: "Which systems hold the data involved?",
    helpText: "e.g. Tally, SAP, Zoho, Salesforce, Excel, email, paper.",
    required: false,
  },
  {
    id: "desired_outcome",
    type: "long_text",
    label: "What would a good outcome look like in the next 3–6 months?",
    required: true,
  },
  {
    id: "constraints",
    type: "multi_select",
    label: "Any constraints we should know about?",
    required: false,
    options: [
      { value: "data_residency_india", label: "Data must stay in India" },
      { value: "regulated_data", label: "Involves regulated / sensitive data" },
      { value: "security_review", label: "A security review will be required" },
      { value: "limited_it_bandwidth", label: "Limited internal IT bandwidth" },
      { value: "existing_vendor_lock", label: "Tied to an existing vendor / system" },
    ],
  },
  {
    id: "timeline_budget_posture",
    type: "single_select",
    label: "Where are you in terms of timeline and budget?",
    required: true,
    options: [
      { value: "exploring", label: "Just exploring" },
      { value: "budgeted_quarter", label: "Budgeted for this quarter" },
      { value: "budgeted_year", label: "Budgeted for this year" },
      { value: "no_budget_yet", label: "No budget identified yet" },
    ],
  },
  {
    id: "industry",
    type: "single_select",
    label: "Which industry are you in?",
    required: true,
    options: INDUSTRIES.map((value) => ({
      value,
      label: value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase()),
    })),
  },
  {
    id: "company_size",
    type: "single_select",
    label: "Roughly how big is the company?",
    required: true,
    options: [
      { value: "lt_50", label: "Under 50 employees" },
      { value: "50_250", label: "50–250 employees" },
      { value: "250_1000", label: "250–1,000 employees" },
      { value: "gt_1000", label: "Over 1,000 employees" },
    ],
  },
];

/** Copy shown when the matcher has no confident capability match (<50%). */
export const NO_CONFIDENT_MATCH = {
  heading: "We can't confidently match this yet — and we won't pretend otherwise.",
  body: "Your problem doesn't map cleanly to something we've delivered before. That usually means it needs a short conversation with one of our specialists to scope properly, rather than an automated recommendation.",
  ctaLabel: "Request an expert review",
} as const;
