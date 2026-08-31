import type { Capability } from "./schema";

/**
 * The Capability Library — v0 (Phase 0).
 *
 * REAL: id, name, oneLiner, description, problemTypes, industries, integrations,
 *       technologies, securityRequirements, prerequisites.
 * TODO(delivery): deliveryStatus, typicalImplementation, typicalOutcomes,
 *       pricingModel — left null/empty on purpose. Fill from actual project data.
 *       Nothing here should be shown to a prospect until those are confirmed.
 *
 * Anchor verticals: manufacturing / distribution_wholesale, healthcare_providers,
 * banking / insurance. Other industries are tagged where genuinely applicable.
 */
export const CAPABILITY_DATA: Capability[] = [
  {
    id: "intelligent-document-extraction",
    name: "Intelligent Document Extraction Pipeline",
    oneLiner:
      "Turn invoices, POs, GRNs, KYC packs and claim forms into structured, validated data automatically.",
    description:
      "An ingestion pipeline that classifies incoming documents, extracts fields with a vision-language model, validates them against business rules and master data, and pushes clean records into the system of record. Handles PDFs, scans and photos, including regional-language and handwritten content, with a human-review queue for low-confidence extractions.",
    problemTypes: [
      "manual_document_processing",
      "repetitive_back_office_workflow",
    ],
    industries: [
      "manufacturing",
      "distribution_wholesale",
      "healthcare_providers",
      "banking",
      "insurance",
      "logistics_transport",
      "professional_services",
    ],
    integrations: [
      "Tally",
      "SAP",
      "Zoho Books",
      "Oracle NetSuite",
      "SharePoint",
      "Google Drive",
      "Email inbox",
    ],
    technologies: [
      "Google Gemini (vision + structured output)",
      "OCR",
      "pgvector",
      "rules engine",
    ],
    securityRequirements: [
      "India data residency for source documents",
      "PII masking in logs",
      "human review of low-confidence records",
      "append-only audit of every extraction and correction",
    ],
    prerequisites: [
      "Sample set of real documents (100+ per type)",
      "Access to master data for validation (vendors, items, customers)",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "invoice-po-grn-matching",
    name: "Invoice–PO–GRN 3-Way Matching Automation",
    oneLiner:
      "Automatically match supplier invoices to purchase orders and goods receipts, and route only the exceptions to a human.",
    description:
      "Builds on document extraction to reconcile each supplier invoice against its purchase order and goods-receipt note. Applies tolerance rules for price, quantity and tax, auto-approves clean matches, and creates a triaged exception queue with the specific mismatch highlighted for the AP team.",
    problemTypes: [
      "invoice_po_matching",
      "repetitive_back_office_workflow",
      "compliance_reporting_burden",
    ],
    industries: [
      "manufacturing",
      "distribution_wholesale",
      "ecommerce_retail",
      "logistics_transport",
      "healthcare_providers",
    ],
    integrations: [
      "SAP",
      "Tally",
      "Oracle NetSuite",
      "Microsoft Dynamics",
      "Zoho Books",
    ],
    technologies: [
      "Google Gemini (structured output)",
      "rules engine",
      "workflow orchestration",
    ],
    securityRequirements: [
      "recorded human approval before any payment-side action",
      "segregation of duties enforced in workflow",
      "append-only audit trail",
    ],
    prerequisites: [
      "PO and GRN data available via API or export",
      "Documented matching tolerances and approval hierarchy",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "customer-support-ai-agent",
    name: "Customer Support AI Agent",
    oneLiner:
      "A grounded AI agent that resolves common customer queries on WhatsApp, web chat and email, and hands off cleanly to a human.",
    description:
      "A retrieval-grounded conversational agent that answers from your approved knowledge base and order/ticket systems, handles multi-turn queries in English and major Indian languages, and escalates to a human with full context when confidence is low or the customer asks. Every automated response is traceable to its source.",
    problemTypes: ["customer_support_volume", "knowledge_retrieval_difficulty"],
    industries: [
      "ecommerce_retail",
      "saas_it_services",
      "banking",
      "insurance",
      "telecom",
      "healthcare_providers",
      "distribution_wholesale",
    ],
    integrations: [
      "WhatsApp Business API",
      "Zendesk",
      "Freshdesk",
      "Zoho Desk",
      "Salesforce Service Cloud",
      "Shopify",
    ],
    technologies: [
      "Google Gemini",
      "pgvector (RAG)",
      "guardrails / output filtering",
    ],
    securityRequirements: [
      "no PII in model training or prompt logs beyond retention window",
      "human handoff always available",
      "responses grounded in approved sources only",
      "recorded approval for any account-changing action",
    ],
    prerequisites: [
      "Curated knowledge base / FAQ / policy docs",
      "API access to order or ticket data for personalised answers",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "internal-knowledge-assistant",
    name: "Internal Knowledge Assistant (RAG)",
    oneLiner:
      "Let staff ask questions in plain language and get answers cited from your SOPs, policies and product documentation.",
    description:
      "A private retrieval-augmented assistant over internal documents — standard operating procedures, HR and compliance policies, product and engineering docs, past project material. Answers include citations to the source passage, respects document-level access permissions, and says 'not found' rather than guessing.",
    problemTypes: [
      "knowledge_retrieval_difficulty",
      "repetitive_back_office_workflow",
    ],
    industries: [
      "manufacturing",
      "saas_it_services",
      "professional_services",
      "healthcare_providers",
      "banking",
      "pharma_lifesciences",
      "public_sector",
    ],
    integrations: [
      "SharePoint",
      "Confluence",
      "Google Drive",
      "Notion",
      "network file shares",
    ],
    technologies: [
      "Google Gemini",
      "pgvector",
      "document-level ACL enforcement",
    ],
    securityRequirements: [
      "retrieval respects source-system permissions",
      "India data residency for the index",
      "no answer without a cited source",
      "audit of who asked what",
    ],
    prerequisites: [
      "Identified document repositories and their owners",
      "Access-permission model for sensitive documents",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "demand-inventory-forecasting",
    name: "Demand & Inventory Forecasting",
    oneLiner:
      "Forecast demand at SKU / location level and translate it into reorder points and safety-stock recommendations.",
    description:
      "A forecasting service that learns from sales history, seasonality, promotions and known events to predict demand, with explainable drivers per forecast. Outputs feed replenishment: recommended reorder quantities, safety stock, and flags for likely stock-outs or excess. Delivered with a monitoring view so planners can see forecast accuracy over time.",
    problemTypes: [
      "demand_forecasting_gap",
      "inventory_optimization",
      "data_scattered_no_single_view",
    ],
    industries: [
      "manufacturing",
      "distribution_wholesale",
      "ecommerce_retail",
      "pharma_lifesciences",
      "automotive",
    ],
    integrations: [
      "SAP",
      "Oracle NetSuite",
      "Microsoft Dynamics",
      "Unicommerce",
      "Excel / CSV exports",
    ],
    technologies: [
      "time-series models",
      "gradient-boosted trees",
      "Python",
      "scheduled batch pipeline",
    ],
    securityRequirements: [
      "aggregated data only where possible",
      "model and data versioning",
      "forecast audit trail",
    ],
    prerequisites: [
      "24+ months of transaction-level sales history",
      "Product and location master data",
      "List of known demand events / promotions",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "workflow-automation-n8n",
    name: "Workflow Automation with n8n",
    oneLiner:
      "Automate approval chains, notifications and system-to-system sync with auditable, self-hostable workflows.",
    description:
      "Design and build workflow automations on n8n (self-hosted for data control) that connect your existing systems: approval routing, status notifications, scheduled data syncs, and event-driven handoffs. Each workflow is version-controlled, logged, and has a clear owner. Often the connective tissue between the other capabilities.",
    problemTypes: [
      "repetitive_back_office_workflow",
      "manual_reporting",
      "data_scattered_no_single_view",
    ],
    industries: [
      "manufacturing",
      "distribution_wholesale",
      "saas_it_services",
      "professional_services",
      "ecommerce_retail",
      "logistics_transport",
      "healthcare_providers",
    ],
    integrations: [
      "n8n",
      "Google Workspace",
      "Microsoft 365",
      "Slack",
      "WhatsApp Business API",
      "REST / webhook APIs",
    ],
    technologies: [
      "n8n (self-hosted)",
      "webhooks",
      "queue-based orchestration",
    ],
    securityRequirements: [
      "self-hosted within client's cloud or India region",
      "secrets in a managed vault, never in workflow JSON",
      "execution logs retained and auditable",
    ],
    prerequisites: [
      "API access to the systems being connected",
      "Documented current process and approval rules",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "data-analytics-foundation",
    name: "Data & Analytics Foundation",
    oneLiner:
      "Bring scattered operational data into one warehouse with a trusted single view and self-serve dashboards.",
    description:
      "Stand up a cloud data warehouse, build pipelines from source systems, model the core business entities, and deliver governed dashboards for the metrics that matter. Establishes the data layer that AI capabilities (forecasting, anomaly detection, reporting automation) depend on.",
    problemTypes: [
      "data_scattered_no_single_view",
      "manual_reporting",
      "compliance_reporting_burden",
    ],
    industries: [
      "manufacturing",
      "distribution_wholesale",
      "ecommerce_retail",
      "banking",
      "insurance",
      "healthcare_providers",
      "saas_it_services",
    ],
    integrations: [
      "PostgreSQL",
      "MySQL",
      "SAP",
      "Tally",
      "Salesforce",
      "Google Analytics",
      "Metabase / Power BI",
    ],
    technologies: [
      "cloud data warehouse",
      "ELT pipelines",
      "dimensional modelling",
      "BI tooling",
    ],
    securityRequirements: [
      "India data residency for the warehouse",
      "row/column-level access control",
      "PII classification and retention policy applied",
      "lineage and transformation audit",
    ],
    prerequisites: [
      "Inventory of source systems and owners",
      "Agreement on the core metrics and their definitions",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "anomaly-fraud-detection",
    name: "Anomaly & Fraud Detection",
    oneLiner:
      "Flag suspicious transactions, claims or usage patterns for review, with the reason for each flag.",
    description:
      "A detection service that scores transactions, claims or events for anomaly risk using a mix of rules and unsupervised models, and produces an explainable alert (which signals fired, how unusual, similar past cases). Built with a feedback loop so investigator decisions improve the model. Decisions remain with humans.",
    problemTypes: ["fraud_anomaly_detection", "compliance_reporting_burden"],
    industries: [
      "banking",
      "insurance",
      "financial_services_other",
      "ecommerce_retail",
      "telecom",
      "distribution_wholesale",
    ],
    integrations: [
      "core banking / lending systems",
      "claims management systems",
      "payment gateways",
      "data warehouse",
    ],
    technologies: [
      "unsupervised anomaly models",
      "rules engine",
      "case-management UI",
      "Python",
    ],
    securityRequirements: [
      "human decision required before any adverse action",
      "explainable reason recorded per alert",
      "model risk documentation (see AI Governance & TRiSM)",
      "full audit of alerts and dispositions",
    ],
    prerequisites: [
      "Historical labelled cases (confirmed fraud / clean) if available",
      "Access to transaction or claims data",
      "Defined investigation workflow",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "contract-policy-review-assistant",
    name: "Contract & Policy Review Assistant",
    oneLiner:
      "Speed up contract and policy review by extracting key clauses, flagging deviations from your playbook, and drafting redlines for a human to approve.",
    description:
      "An assistant that reads contracts and policy documents, extracts key terms (parties, value, term, liability, termination, data-protection clauses), compares them against your standard playbook, and highlights deviations with suggested redlines. Every suggestion is reviewed and accepted by a person; the assistant never sends or signs anything.",
    problemTypes: [
      "contract_review_slow",
      "manual_document_processing",
      "compliance_reporting_burden",
    ],
    industries: [
      "banking",
      "insurance",
      "professional_services",
      "manufacturing",
      "saas_it_services",
      "pharma_lifesciences",
      "healthcare_providers",
    ],
    integrations: [
      "SharePoint",
      "Google Drive",
      "DocuSign",
      "contract lifecycle management tools",
    ],
    technologies: [
      "Google Gemini (long-context + structured output)",
      "pgvector",
      "clause playbook rules",
    ],
    securityRequirements: [
      "confidential documents stay in India region",
      "no outbound draft without recorded human approval",
      "access limited to the matter's legal team",
      "audit of every suggestion and decision",
    ],
    prerequisites: [
      "A documented clause playbook / standard positions",
      "Sample set of past contracts",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "claims-processing-automation",
    name: "Claims Processing Automation",
    oneLiner:
      "Automate intake, validation and triage of insurance and healthcare reimbursement claims, with adjudication left to humans.",
    description:
      "End-to-end claims intake: extract data from claim forms and supporting documents, validate against policy and eligibility rules, detect missing information and request it, score for fast-track vs. detailed review, and prepare a decision-ready package for the adjudicator. Combines document extraction, workflow automation and anomaly detection for a specific process.",
    problemTypes: [
      "claims_processing_slow",
      "manual_document_processing",
      "repetitive_back_office_workflow",
      "fraud_anomaly_detection",
    ],
    industries: [
      "insurance",
      "healthcare_providers",
      "financial_services_other",
    ],
    integrations: [
      "claims management systems",
      "TPA / hospital HIS systems",
      "policy administration systems",
    ],
    technologies: [
      "Google Gemini",
      "rules engine",
      "n8n workflow orchestration",
      "anomaly scoring",
    ],
    securityRequirements: [
      "patient / policyholder data in India region only",
      "strict PII access control and masking",
      "human adjudication of every claim decision",
      "append-only audit of the full claim lifecycle",
    ],
    prerequisites: [
      "Digitised policy / eligibility rules",
      "Sample claims with documents",
      "Defined adjudication workflow and SLAs",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "ai-governance-trism-program",
    name: "AI Governance & TRiSM Program Setup",
    oneLiner:
      "Stand up the inventory, risk scoring, policies and controls to run AI safely across the organisation.",
    description:
      "Establishes an AI Trust, Risk and Security Management (TRiSM) program: an inventory of AI models, applications and agents; a risk-scoring method; usage and data policies; approval workflows; and ongoing evaluation and monitoring hooks. Aligned to the Gartner AI TRiSM framework and India's DPDP obligations. Produces a working governance operating model, not just a policy PDF.",
    problemTypes: [
      "ai_governance_gap",
      "model_risk_unmanaged",
      "compliance_reporting_burden",
    ],
    industries: [
      "banking",
      "insurance",
      "financial_services_other",
      "healthcare_providers",
      "pharma_lifesciences",
      "saas_it_services",
      "manufacturing",
      "public_sector",
      "telecom",
    ],
    integrations: [
      "existing GRC tooling",
      "model registries",
      "CI/CD pipelines",
      "identity provider",
    ],
    technologies: [
      "AI model inventory",
      "risk-scoring rubric",
      "policy-as-workflow",
      "evaluation harness",
    ],
    securityRequirements: [
      "every AI system inventoried and owned",
      "risk tier assigned before production use",
      "human accountability recorded for each AI system",
      "periodic re-evaluation and drift monitoring",
    ],
    prerequisites: [
      "Executive sponsor for AI governance",
      "Willingness to inventory current AI / GenAI usage (including shadow use)",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
  {
    id: "ai-application-security-assessment",
    name: "AI Application Security Assessment",
    oneLiner:
      "Red-team your LLM applications and agents for prompt injection, data leakage, tool misuse and unsafe outputs.",
    description:
      "A structured security assessment of a specific AI application or agent: adversarial testing for prompt injection and jailbreaks, sensitive-data-leakage probes, tool/function-call abuse, excessive-agency checks, and output-safety evaluation. Delivered as a findings report with severity ratings, reproduction steps and prioritised remediation, mapped to the OWASP LLM Top 10 and the AI TRiSM framework.",
    problemTypes: [
      "ai_security_exposure",
      "model_risk_unmanaged",
      "ai_governance_gap",
    ],
    industries: [
      "banking",
      "insurance",
      "financial_services_other",
      "saas_it_services",
      "healthcare_providers",
      "telecom",
      "ecommerce_retail",
      "public_sector",
    ],
    integrations: [
      "the target AI application / API",
      "CI/CD for regression tests",
      "issue trackers",
    ],
    technologies: [
      "adversarial prompt suites",
      "automated red-team tooling",
      "OWASP LLM Top 10",
      "evaluation harness",
    ],
    securityRequirements: [
      "written authorisation and scope before testing",
      "test data isolated from production PII",
      "findings shared only with the client's security team",
      "no exploit code distributed beyond remediation needs",
    ],
    prerequisites: [
      "A deployed AI application or agent to test (staging acceptable)",
      "Signed testing authorisation and rules of engagement",
    ],
    deliveryStatus: null,
    typicalImplementation: null,
    typicalOutcomes: [],
    pricingModel: [],
    relatedCaseStudies: [],
  },
];
