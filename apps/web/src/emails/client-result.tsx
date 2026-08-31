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

import { BAND_LABEL, type AssessmentEmailData } from "./types";

/**
 * The email a prospect receives — a factual copy of what they already saw on the
 * result page, plus the "how this could be solved" narrative. No invented
 * timelines, metrics, or outcomes (CLAUDE.md #2). Sent only after a staff member
 * approves it (CLAUDE.md #7).
 */
export function ClientResultEmail(data: AssessmentEmailData) {
  const preview = data.noConfidentMatch
    ? "We've received your assessment — a specialist will be in touch"
    : `Your AI opportunity assessment — ${BAND_LABEL[data.band]} opportunity`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>AI GROWTH ENGINE</Text>
          <Heading style={h1}>Your AI opportunity assessment</Heading>

          {data.noConfidentMatch ? (
            <Text style={p}>
              Thanks for describing your problem. It doesn&apos;t map cleanly to
              something we&apos;ve delivered before, so rather than an automated
              recommendation, one of our specialists will review it and get in
              touch to scope the right approach.
            </Text>
          ) : (
            <>
              <Text style={p}>
                <strong>{BAND_LABEL[data.band]} opportunity</strong> ·
                opportunity score {data.score}/100
              </Text>
              {data.summary ? <Text style={p}>{data.summary}</Text> : null}

              {data.narrative ? (
                <Section>
                  <Heading as="h2" style={h2}>
                    How this could be solved
                  </Heading>
                  <Text style={p}>{data.narrative.summary}</Text>
                  {data.narrative.steps.map((step, i) => (
                    <Text key={i} style={step_}>
                      {i + 1}. {step}
                    </Text>
                  ))}
                </Section>
              ) : null}

              {data.matches.length > 0 ? (
                <Section>
                  <Heading as="h2" style={h2}>
                    Capabilities that apply
                  </Heading>
                  {data.matches.map((m) => (
                    <Text key={m.name} style={p}>
                      <strong>{m.name}</strong>
                      <br />
                      {m.oneLiner}
                      {m.inDiscovery ? (
                        <>
                          <br />
                          <em style={muted}>
                            In discovery — we&apos;ll scope timelines and
                            outcomes with you directly.
                          </em>
                        </>
                      ) : null}
                    </Text>
                  ))}
                </Section>
              ) : null}
            </>
          )}

          <Hr style={hr} />
          <Text style={p}>
            <Link href={data.resultUrl} style={link}>
              View your full assessment →
            </Link>
          </Text>
          <Text style={muted}>
            You received this because you submitted a business problem to AI
            Growth Engine.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ClientResultEmail;

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
