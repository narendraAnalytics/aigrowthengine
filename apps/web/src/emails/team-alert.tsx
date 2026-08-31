import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

import { BAND_LABEL, type AssessmentEmailData } from "./types";

/**
 * Internal lead-alert email — sent automatically on every scored assessment.
 * Carries everything the team needs to triage, plus the link to approve + send
 * the client result email.
 */
export function TeamAlertEmail(data: AssessmentEmailData) {
  return (
    <Html>
      <Head />
      <Preview>{`[${BAND_LABEL[data.band]} · ${data.score}] ${data.company}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>
            New assessment — {BAND_LABEL[data.band]} · {data.score}/100
          </Heading>

          <Text style={p}>
            <strong>Company:</strong> {data.company}
            <br />
            <strong>Contact:</strong> {data.contactEmail}
            {data.contactNote ? (
              <>
                <br />
                <strong>Note:</strong> {data.contactNote}
              </>
            ) : null}
          </Text>

          {data.summary ? (
            <>
              <Heading as="h2" style={h2}>
                Summary
              </Heading>
              <Text style={p}>{data.summary}</Text>
            </>
          ) : null}

          <Heading as="h2" style={h2}>
            {data.noConfidentMatch
              ? "No confident capability match"
              : "Matched capabilities"}
          </Heading>
          {data.matches.length === 0 ? (
            <Text style={p}>None above the confidence threshold.</Text>
          ) : (
            data.matches.map((m) => (
              <Text key={m.name} style={p}>
                <strong>{m.name}</strong> — {m.confidencePct}% ({m.matchClass})
                <br />
                {m.oneLiner}
              </Text>
            ))
          )}

          {data.narrative ? (
            <>
              <Heading as="h2" style={h2}>
                Draft solution narrative
              </Heading>
              <Text style={p}>{data.narrative.summary}</Text>
              {data.narrative.steps.map((s, i) => (
                <Text key={i} style={step_}>
                  {i + 1}. {s}
                </Text>
              ))}
            </>
          ) : null}

          <Heading as="h2" style={h2}>
            Score breakdown
          </Heading>
          {data.breakdown.map((f) => (
            <Text key={f.label} style={step_}>
              <strong>{f.label}</strong> ({f.weight}) — {f.level} · {f.points}{" "}
              pts
              <br />
              <span style={muted}>{f.rationale}</span>
            </Text>
          ))}

          <Hr style={hr} />
          <Text style={p}>
            <Link href={data.approvalUrl} style={link}>
              Review &amp; approve the client email →
            </Link>
          </Text>
          <Text style={muted}>
            <Link href={data.resultUrl}>Result page</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default TeamAlertEmail;

const body = { backgroundColor: "#f6f3ee", fontFamily: "Arial, sans-serif" };
const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "28px 24px",
  backgroundColor: "#ffffff",
};
const h1 = { fontSize: "20px", color: "#1f1220", margin: "0 0 16px" };
const h2 = { fontSize: "15px", color: "#1f1220", margin: "22px 0 6px" };
const p = {
  fontSize: "14px",
  lineHeight: "21px",
  color: "#2a1b2e",
  margin: "0 0 10px",
};
const step_ = {
  fontSize: "13px",
  lineHeight: "19px",
  color: "#2a1b2e",
  margin: "0 0 8px",
};
const muted = { fontSize: "12px", color: "#8a7e70" };
const link = { color: "#b0447f", fontWeight: 700 as const };
const hr = { borderColor: "#e7e0d6", margin: "22px 0" };
