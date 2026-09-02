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
 * Voice "Call Me" follow-up emails.
 *
 * - `confirmation` — auto-sent to the address entered on the Connect Me form
 *   (CLAUDE.md #7 exception): "we've got it, our AI assistant will call you".
 * - `team_alert`   — new call request landed, framed for the internal inbox.
 * - `team_summary` — sent after the call ends: outcome + transcript.
 */

export type VoiceEmailData = {
  variant: "confirmation" | "team_alert" | "team_summary";
  fullName: string;
  company: string | null;
  phoneE164: string;
  email: string | null;
  requirement: string;
  siteUrl: string;
  // team_summary only
  outcomeLabel?: string | null;
  durationSeconds?: number | null;
  callStatus?: string | null;
  summary?: string | null;
  transcript?: { role: string; text: string }[] | null;
};

export function VoiceCallEmail(data: VoiceEmailData) {
  const isConfirmation = data.variant === "confirmation";
  const isSummary = data.variant === "team_summary";
  const first = data.fullName.split(" ")[0] || data.fullName;

  const preview = isConfirmation
    ? "We've got your request — our AI assistant will call you shortly"
    : isSummary
      ? `Call outcome — ${data.fullName} (${data.outcomeLabel ?? "n/a"})`
      : `New call request — ${data.fullName}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>AI GROWTH ENGINE · CALL ME</Text>

          {isConfirmation ? (
            <>
              <Heading style={h1}>Your request has been received</Heading>
              <Text style={p}>Hi {first},</Text>
              <Text style={p}>
                Thanks — our AI assistant will call you shortly on{" "}
                {data.phoneE164} to talk through what you need. The call takes a
                few minutes; a member of our team follows up after.
              </Text>
            </>
          ) : isSummary ? (
            <Heading style={h1}>Call completed</Heading>
          ) : (
            <Heading style={h1}>New call request</Heading>
          )}

          <Section style={boxed}>
            <Row label="Name" value={data.fullName} />
            {data.company ? <Row label="Company" value={data.company} /> : null}
            <Row label="Phone" value={data.phoneE164} />
            {data.email ? <Row label="Email" value={data.email} /> : null}
          </Section>

          <Heading as="h2" style={h2}>
            What they need help with
          </Heading>
          <Text style={p}>{data.requirement}</Text>

          {isSummary ? (
            <>
              <Hr style={hr} />
              <Section style={boxed}>
                <Row label="Outcome" value={data.outcomeLabel ?? "n/a"} />
                <Row label="Call status" value={data.callStatus ?? "n/a"} />
                <Row
                  label="Duration"
                  value={
                    data.durationSeconds != null
                      ? `${data.durationSeconds}s`
                      : "n/a"
                  }
                />
              </Section>
              {data.summary ? (
                <>
                  <Heading as="h2" style={h2}>
                    Summary
                  </Heading>
                  <Text style={p}>{data.summary}</Text>
                </>
              ) : null}
              {data.transcript && data.transcript.length > 0 ? (
                <>
                  <Heading as="h2" style={h2}>
                    Transcript
                  </Heading>
                  {data.transcript.map((turn, i) => (
                    <Text key={i} style={transcriptLine}>
                      <span style={rowLabel}>
                        {turn.role === "agent" ? "AI" : "Caller"}:{" "}
                      </span>
                      {turn.text}
                    </Text>
                  ))}
                </>
              ) : null}
            </>
          ) : null}

          {isConfirmation ? (
            <>
              <Hr style={hr} />
              <Text style={p}>
                <Link href={`${data.siteUrl}/ai-opportunities`} style={link}>
                  Explore the platform while you wait →
                </Link>
              </Text>
              <Text style={muted}>
                You agreed to receive this one follow-up call when you submitted
                the form. Reply to this email if you&apos;d rather not be
                called.
              </Text>
            </>
          ) : (
            <>
              <Hr style={hr} />
              <Text style={muted}>
                Reply to reach {data.fullName}
                {data.email ? ` at ${data.email}` : ""}.
              </Text>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowStyle}>
      <span style={rowLabel}>{label}: </span>
      {value}
    </Text>
  );
}

export default VoiceCallEmail;

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
const muted = { fontSize: "12px", color: "#8a7e70", lineHeight: "18px" };
const link = { color: "#b0447f", fontWeight: 700 as const };
const hr = { borderColor: "#e7e0d6", margin: "24px 0" };
const boxed = {
  backgroundColor: "#f4f5fc",
  borderRadius: "12px",
  padding: "14px 18px",
  margin: "8px 0 16px",
};
const rowStyle = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#2a1b2e",
  margin: "0 0 4px",
};
const transcriptLine = {
  fontSize: "13px",
  lineHeight: "19px",
  color: "#2a1b2e",
  margin: "0 0 6px",
};
const rowLabel = { color: "#5b6478", fontWeight: 700 as const };
