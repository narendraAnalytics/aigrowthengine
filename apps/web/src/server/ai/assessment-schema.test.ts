import { describe, expect, it } from "vitest";

import { PROBLEM_TYPES } from "@/lib/capabilities";
import { FACTOR_IDS, SIGNAL_LEVELS } from "@/lib/scoring/factors";

import {
  assessmentModelResponseSchema,
  buildAssessmentJsonSchema,
} from "./assessment-schema";

function validResponse() {
  return {
    problem_types: ["invoice_po_matching"],
    signals: Object.fromEntries(
      FACTOR_IDS.map((id) => [id, { level: "partial", rationale: "because" }]),
    ) as Record<string, { level: string; rationale: string }>,
    summary: "A bounded finance problem with a clear automation path.",
  };
}

describe("assessmentModelResponseSchema", () => {
  it("accepts a well-formed model response", () => {
    expect(() =>
      assessmentModelResponseSchema.parse(validResponse()),
    ).not.toThrow();
  });

  it("rejects a response missing a scoring factor", () => {
    const bad = validResponse();
    delete (bad.signals as Record<string, unknown>).urgency;
    expect(() => assessmentModelResponseSchema.parse(bad)).toThrow();
  });

  it("rejects an unknown signal level", () => {
    const bad = validResponse();
    bad.signals.urgency = { level: "maybe", rationale: "x" };
    expect(() => assessmentModelResponseSchema.parse(bad)).toThrow();
  });

  it("rejects extra top-level keys", () => {
    expect(() =>
      assessmentModelResponseSchema.parse({ ...validResponse(), score: 91 }),
    ).toThrow();
  });
});

type JsonNode = {
  type?: string;
  additionalProperties?: boolean;
  enum?: readonly string[];
  required?: readonly string[];
  items?: JsonNode;
  properties?: Record<string, JsonNode>;
};

describe("buildAssessmentJsonSchema", () => {
  const schema = buildAssessmentJsonSchema() as JsonNode;

  it("satisfies Groq strict-mode rules recursively", () => {
    const visit = (node: JsonNode) => {
      if (node.type === "object") {
        expect(node.additionalProperties ?? true).toBe(false);
        const props = Object.keys(node.properties ?? {});
        expect(new Set(node.required ?? [])).toEqual(new Set(props));
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === "object") visit(value as JsonNode);
      }
    };
    visit(schema);
  });

  it("mirrors the factor ids and vocabularies of the Zod schema", () => {
    const signals = schema.properties?.signals;
    expect(new Set(signals?.required ?? [])).toEqual(new Set(FACTOR_IDS));

    const ptEnum = schema.properties?.problem_types?.items?.enum ?? [];
    expect(new Set(ptEnum)).toEqual(new Set(PROBLEM_TYPES));

    const firstFactor = FACTOR_IDS[0];
    const levelEnum =
      signals?.properties?.[firstFactor]?.properties?.level?.enum ?? [];
    expect(new Set(levelEnum)).toEqual(new Set(SIGNAL_LEVELS));
  });
});
