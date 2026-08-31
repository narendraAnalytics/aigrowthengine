import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { ClientResultEmail } from "./client-result";
import { TeamAlertEmail } from "./team-alert";

import type { AssessmentEmailData } from "./types";

const data: AssessmentEmailData = {
  company: "Acme Manufacturing",
  contactEmail: "ops@acme.example",
  contactNote: "Keen to start this quarter",
  band: "high",
  score: 85,
  summary: "Manual invoice-to-PO matching consumes significant finance time.",
  narrative: {
    summary: "You would introduce automated document capture and matching.",
    steps: ["Capture invoices automatically", "Match against POs and GRNs"],
  },
  matches: [
    {
      name: "Invoice–PO–GRN 3-Way Matching Automation",
      oneLiner: "Automate three-way matching so only exceptions reach a human.",
      confidencePct: 78,
      matchClass: "partial",
      inDiscovery: true,
    },
  ],
  breakdown: [
    {
      label: "Business Impact",
      weight: 25,
      level: "full",
      points: 25,
      rationale: "Large quantified cost.",
    },
  ],
  noConfidentMatch: false,
  resultUrl: "https://example.com/business-assessment/abc/result",
  approvalUrl: "https://example.com/admin/assessments/abc/email",
};

describe("ClientResultEmail", () => {
  it("renders the band, score and result link", async () => {
    const html = await render(ClientResultEmail(data));
    expect(html).toContain("HIGH");
    expect(html).toContain("85");
    expect(html).toContain(data.resultUrl);
    expect(html).toContain("Invoice–PO–GRN 3-Way Matching Automation");
    expect(html).toContain("In discovery");
  });

  it("does not leak the internal breakdown rationale to the client", async () => {
    const html = await render(ClientResultEmail(data));
    expect(html).not.toContain("Large quantified cost.");
    expect(html).not.toContain(data.approvalUrl);
  });
});

describe("TeamAlertEmail", () => {
  it("includes contact details, the breakdown and the approval link", async () => {
    const html = await render(TeamAlertEmail(data));
    expect(html).toContain("Acme Manufacturing");
    expect(html).toContain("ops@acme.example");
    expect(html).toContain("Keen to start this quarter");
    expect(html).toContain("Business Impact");
    expect(html).toContain(data.approvalUrl);
  });
});
