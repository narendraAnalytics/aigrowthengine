import { describe, expect, it } from "vitest";

import { IDEA_DIMENSION_IDS, IDEA_SIGNAL_LEVELS } from "@/lib/idea";

import { buildIdeaJsonSchema, ideaModelResponseSchema } from "./idea-schema";

function validResponse() {
  return {
    signals: Object.fromEntries(
      IDEA_DIMENSION_IDS.map((id) => [
        id,
        { level: "partial", rationale: "because" },
      ]),
    ) as Record<string, { level: string; rationale: string }>,
    summary: "A plausible idea with a reachable first market.",
    main_risk: "Building before demand is proven.",
    ai_approaches: ["intent classification", "retrieval over a knowledge base"],
  };
}

describe("ideaModelResponseSchema", () => {
  it("accepts a well-formed model response", () => {
    expect(() => ideaModelResponseSchema.parse(validResponse())).not.toThrow();
  });

  it("accepts an empty ai_approaches array", () => {
    expect(() =>
      ideaModelResponseSchema.parse({ ...validResponse(), ai_approaches: [] }),
    ).not.toThrow();
  });

  it("rejects a response missing a dimension", () => {
    const bad = validResponse();
    delete (bad.signals as Record<string, unknown>).market_potential;
    expect(() => ideaModelResponseSchema.parse(bad)).toThrow();
  });

  it("rejects an unknown signal level", () => {
    const bad = validResponse();
    bad.signals.ai_feasibility = { level: "maybe", rationale: "x" };
    expect(() => ideaModelResponseSchema.parse(bad)).toThrow();
  });

  it("rejects extra top-level keys (e.g. a score)", () => {
    expect(() =>
      ideaModelResponseSchema.parse({
        ...validResponse(),
        potential_score: 80,
      }),
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

describe("buildIdeaJsonSchema", () => {
  const schema = buildIdeaJsonSchema() as JsonNode;

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

  it("mirrors the dimension ids and level vocabulary of the Zod schema", () => {
    const signals = schema.properties?.signals;
    expect(new Set(signals?.required ?? [])).toEqual(
      new Set(IDEA_DIMENSION_IDS),
    );
    const first = IDEA_DIMENSION_IDS[0];
    const levelEnum =
      signals?.properties?.[first]?.properties?.level?.enum ?? [];
    expect(new Set(levelEnum)).toEqual(new Set(IDEA_SIGNAL_LEVELS));
  });
});
