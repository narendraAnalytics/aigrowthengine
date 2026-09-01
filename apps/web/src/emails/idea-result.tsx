import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * The email a founder receives after an AI Idea Assessment — a factual copy of
 * what they saw on the result page, plus a warm "contact us for the full
 * picture" close. No invented timelines, metrics or outcomes. Auto-sent to the
 * address entered on the form (CLAUDE.md #7 exception).
 */

export type IdeaEmailData = {
  ideaOneliner: string;
  contactName: string | null;
  verdictLabel: string;
  verdictTagline: string;
  potentialScore: number;
  summary: string | null;
  mainRisk: string | null;
  recommendedPath: string[];
  resultUrl: string;
};

export function IdeaResultEmail(data: IdeaEmailData) {
  const preview = `Your AI idea assessment — ${data.verdictLabel} · ${data.potentialScore}/100`;
  const greeting = data.contactName ? `Hi ${data.contactName},` : "Hi,";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>AI GROWTH ENGINE</Text>
          <Heading style={h1}>Your AI idea assessment</Heading>

          <Text style={p}>{greeting}</Text>
          <Text style={p}>
            Here&apos;s our read on <strong>{data.ideaOneliner}</strong>.
          </Text>

          <Section style={verdictBox}>
            <Text style={verdictLabel}>{data.verdictLabel}</Text>
            <Text style={verdictScore}>
              Potential {data.potentialScore}/100
            </Text>
            <Text style={verdictTag}>{data.verdictTagline}</Text>
          </Section>

          {data.summary ? <Text style={p}>{data.summary}</Text> : null}

          {data.mainRisk ? (
            <>
              <Heading as="h2" style={h2}>
                Biggest risk
              </Heading>
              <Text style={p}>{data.mainRisk}</Text>
            </>
          ) : null}

          {data.recommendedPath.length > 0 ? (
            <Section>
              <Heading as="h2" style={h2}>
                Recommended next steps
              </Heading>
              {data.recommendedPath.map((step, i) => (
                <Text key={i} style={step_}>
                  {i + 1}. {step}
                </Text>
              ))}
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={p}>
            <Link href={data.resultUrl} style={link}>
              View your full assessment →
            </Link>
          </Text>
          <Text style={p}>
            Want to take this further? Our team can help you validate the
            opportunity, design the solution, build the MVP and scale it
            securely. Just reply to this email and we&apos;ll set up a call.
          </Text>
          <Text style={muted}>
            This assessment is AI-generated and intended for initial guidance.
            It does not replace market research, technical due diligence, or
            legal, financial or professional advice.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default IdeaResultEmail;

const body = { backgroundColor: "#f6f3ee", fontFamily: "Arial, sans-serif" };
const container = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 28px",
  backgroundColor: "#ffffff",
};
const eyebrow = {
  fontSize: "11px",
  letterSpacing: "1.5px",
  color: "#9b8e7d",
  margin: "0 0 6px",
};
const h1 = { fontSize: "22px", color: "#1f1220", margin: "0 0 16px" };
const h2 = { fontSize: "16px", color: "#1f1220", margin: "24px 0 8px" };
const p = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#2a1b2e",
  margin: "0 0 12px",
};
const step_ = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#2a1b2e",
  margin: "0 0 6px",
};
const muted = { fontSize: "12px", color: "#8a7e70", lineHeight: "18px" };
const link = { color: "#b0447f", fontWeight: 700 as const };
const hr = { borderColor: "#e7e0d6", margin: "24px 0" };
const verdictBox = {
  backgroundColor: "#f4f5fc",
  borderRadius: "12px",
  padding: "16px 18px",
  margin: "0 0 16px",
};
const verdictLabel = {
  fontSize: "18px",
  fontWeight: 800 as const,
  color: "#1f1220",
  margin: "0 0 2px",
  letterSpacing: "0.5px",
};
const verdictScore = {
  fontSize: "13px",
  fontWeight: 700 as const,
  color: "#5b6478",
  margin: "0 0 6px",
};
const verdictTag = {
  fontSize: "13px",
  lineHeight: "19px",
  color: "#2a1b2e",
  margin: 0,
};
