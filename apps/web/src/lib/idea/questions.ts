import type { AssessmentQuestion } from "@/lib/assessment/questions";

/**
 * AI Idea Assessment intake questions.
 *
 * A founder describes an idea; these questions collect just enough structured
 * context for the classifier to judge the 5 dimensions (see ./dimensions.ts) and
 * for the deterministic verdict function to have real inputs. Keep it short —
 * every extra field costs completion rate. Contact is a separate step.
 *
 * Reuses the `AssessmentQuestion` shape so the form renderer and the derived Zod
 * contract are shared with the business assessment.
 */

export type IdeaQuestion = AssessmentQuestion;

export const IDEA_QUESTIONS: IdeaQuestion[] = [
  {
    id: "idea_oneliner",
    type: "short_text",
    label: "What's your idea, in one sentence?",
    helpText:
      'e.g. "An AI assistant that handles small businesses\' WhatsApp customer enquiries."',
    required: true,
  },
  {
    id: "idea_description",
    type: "long_text",
    label: "Describe it in a few sentences.",
    helpText: "What does it do, and what makes it useful?",
    required: true,
  },
  {
    id: "problem",
    type: "long_text",
    label: "What problem does it solve?",
    helpText:
      "What frustration, cost, inefficiency or unmet need are you tackling?",
    required: true,
  },
  {
    id: "who_has_problem",
    type: "single_select",
    label: "Who has this problem?",
    required: true,
    options: [
      { value: "businesses", label: "Businesses" },
      { value: "consumers", label: "Consumers" },
      { value: "developers", label: "Developers" },
      { value: "professionals", label: "Professionals" },
      { value: "students", label: "Students" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "problem_frequency",
    type: "single_select",
    label: "How often does this problem occur for them?",
    required: true,
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "occasionally", label: "Occasionally" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "target_customer",
    type: "short_text",
    label: "Who is your first target customer?",
    helpText: 'e.g. "Small retailers in India with 5–20 employees."',
    required: true,
  },
  {
    id: "launch_region",
    type: "single_select",
    label: "Where do you want to launch first?",
    required: true,
    options: [
      { value: "india", label: "India" },
      { value: "global", label: "Global" },
      { value: "specific_region", label: "A specific country / region" },
      { value: "undecided", label: "Not decided" },
    ],
  },
  {
    id: "existing_alternatives",
    type: "long_text",
    label: "How do people solve this today?",
    helpText:
      "Existing software, competitors, spreadsheets, manual work, doing nothing…",
    required: true,
  },
  {
    id: "customer_evidence",
    type: "single_select",
    label: "Do you already have potential customers?",
    required: true,
    options: [
      { value: "paying", label: "Yes — paying customers" },
      { value: "interested", label: "Yes — interested users / a waitlist" },
      { value: "spoken", label: "I've spoken with potential customers" },
      { value: "none", label: "Not yet" },
    ],
  },
  {
    id: "monetization",
    type: "single_select",
    label: "How could it make money?",
    required: true,
    options: [
      { value: "subscription", label: "Subscription" },
      { value: "one_time", label: "One-time purchase" },
      { value: "commission", label: "Commission" },
      { value: "marketplace", label: "Marketplace" },
      { value: "service", label: "Service" },
      { value: "advertising", label: "Advertising" },
      { value: "undecided", label: "Not decided" },
    ],
  },
  {
    id: "idea_stage",
    type: "single_select",
    label: "What stage is the idea at?",
    required: true,
    options: [
      { value: "just_idea", label: "Just an idea" },
      { value: "researching", label: "Researching" },
      { value: "prototype", label: "Prototype" },
      { value: "mvp", label: "MVP" },
      { value: "launched", label: "Already launched" },
      { value: "revenue", label: "Already generating revenue" },
    ],
  },
  {
    id: "needs_ai",
    type: "single_select",
    label: "Does the solution need AI?",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "maybe", label: "Maybe" },
      { value: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "anything_else",
    type: "long_text",
    label: "Anything else we should know?",
    required: false,
  },
];
