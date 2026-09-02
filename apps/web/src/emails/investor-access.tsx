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
 * Investor Room "Request Investor Access" emails.
 *
 * - `confirmation` — auto-sent to the address entered on the form (CLAUDE.md #7
 *   exception): a warm "we've received it" note plus a few links to keep the
 *   investor engaged while the team reviews.
 * - `team_alert` — the same facts, framed for the internal inbox.
 *
 * No invented traction, valuation or funding numbers.
 */

export type InvestorEmailData = {
  variant: "confirmation" | "team_alert";
  fullName: string;
  workEmail: string;
  company: string;
  roleLabel: string | null;
  interestLabels: string[];
  stageLabel: string | null;
  geographyLabel: string | null;
  learnMore: string | null;
  siteUrl: string;
};

export function InvestorAccessEmail(data: InvestorEmailData) {
  const isTeam = data.variant === "team_alert";
  const preview = isTeam
    ? `Investor interest — ${data.company} (${data.roleLabel ?? "role n/a"})`
    : "Your investor access request has been received";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>AI GROWTH ENGINE · INVESTOR ROOM</Text>

          {isTeam ? (
            <Heading style={h1}>New investor-access request</Heading>
          ) : (
            <Heading style={h1}>Thank you — request received</Heading>
          )}

          {isTeam ? (
            <Text style={p}>
              A visitor submitted the Request Investor Access form.
            </Text>
          ) : (
            <>
              <Text style={p}>
                Hi {data.fullName.split(" ")[0] || data.fullName},
              </Text>
              <Text style={p}>
                Your investor request has been received. We&apos;ll review your
                information and get back to you with the appropriate company and
                investment materials.
              </Text>
            </>
          )}

          <Section style={boxed}>
            <Row label="Name" value={data.fullName} />
            <Row label="Work email" value={data.workEmail} />
            <Row label="Company / fund" value={data.company} />
            {data.roleLabel ? (
              <Row label="Role" value={data.roleLabel} />
            ) : null}
            {data.interestLabels.length > 0 ? (
              <Row
                label="Interested in"
                value={data.interestLabels.join(", ")}
              />
            ) : null}
            {data.stageLabel ? (
              <Row label="Stage" value={data.stageLabel} />
            ) : null}
            {data.geographyLabel ? (
              <Row label="Geography" value={data.geographyLabel} />
            ) : null}
          </Section>

          {data.learnMore ? (
            <>
              <Heading as="h2" style={h2}>
                What they&apos;d like to learn more about
              </Heading>
              <Text style={p}>{data.learnMore}</Text>
            </>
          ) : null}

          {!isTeam ? (
            <>
              <Hr style={hr} />
              <Heading as="h2" style={h2}>
                While you wait
              </Heading>
              <Text style={p}>
                <Link href={`${data.siteUrl}/ai-opportunities`} style={link}>
                  Explore the platform →
                </Link>
              </Text>
              <Text style={p}>
                <Link href={`${data.siteUrl}/investor-room`} style={link}>
                  Revisit the Investor Room →
                </Link>
              </Text>
              <Text style={muted}>
                This message confirms receipt of your request. It is not an
                offer of securities or an invitation to invest.
              </Text>
            </>
          ) : (
            <>
              <Hr style={hr} />
              <Text style={muted}>
                Reply to this address to reach {data.fullName} at{" "}
                {data.workEmail}.
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

export default InvestorAccessEmail;

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
const rowLabel = { color: "#5b6478", fontWeight: 700 as const };
