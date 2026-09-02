import "server-only";

import { render } from "@react-email/components";
import { eq } from "drizzle-orm";

import {
  InvestorAccessEmail,
  type InvestorEmailData,
} from "@/emails/investor-access";
import { env } from "@/env";
import {
  INVESTOR_GEOGRAPHIES,
  INVESTOR_INTERESTS,
  INVESTOR_ROLES,
  INVESTOR_STAGES,
} from "@/lib/investor";
import { SITE } from "@/lib/site";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import { sendEmail } from "./resend";

/**
 * Assembles, records and sends the two investor-interest emails. Both are
 * best-effort — a send failure is recorded but never fails the pipeline.
 */

const labelOf = (
  opts: readonly { value: string; label: string }[],
  value: string | null,
) => opts.find((o) => o.value === value)?.label ?? null;

type Loaded = {
  base: Omit<InvestorEmailData, "variant">;
};

async function loadInvestorEmailData(
  requestId: string,
): Promise<Loaded | null> {
  const row = await db.query.investorInterestRequests.findFirst({
    where: eq(schema.investorInterestRequests.id, requestId),
  });
  if (!row) return null;

  const interests = Array.isArray(row.interests)
    ? (row.interests as string[])
    : [];

  return {
    base: {
      fullName: row.fullName,
      workEmail: row.workEmail,
      company: row.company,
      roleLabel: labelOf(INVESTOR_ROLES, row.role),
      interestLabels: interests
        .map((v) => labelOf(INVESTOR_INTERESTS, v))
        .filter((l): l is string => l != null),
      stageLabel: labelOf(INVESTOR_STAGES, row.stage),
      geographyLabel: labelOf(INVESTOR_GEOGRAPHIES, row.geography),
      learnMore: row.learnMore,
      siteUrl: SITE.url,
    },
  };
}

async function recordEmailRow(values: {
  requestId: string;
  kind: "confirmation" | "team_alert";
  status: "sent" | "failed";
  toEmail: string;
  subject: string;
  bodyHtml: string;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}) {
  await db
    .insert(schema.investorAccessEmails)
    .values({
      requestId: values.requestId,
      kind: values.kind,
      status: values.status,
      toEmail: values.toEmail,
      subject: values.subject,
      bodyHtml: values.bodyHtml,
      providerMessageId: values.providerMessageId ?? null,
      error: values.error ?? null,
      sentAt: values.sentAt ?? null,
    })
    .onConflictDoUpdate({
      target: [
        schema.investorAccessEmails.requestId,
        schema.investorAccessEmails.kind,
      ],
      set: {
        status: values.status,
        subject: values.subject,
        bodyHtml: values.bodyHtml,
        providerMessageId: values.providerMessageId ?? null,
        error: values.error ?? null,
        sentAt: values.sentAt ?? null,
        updatedAt: new Date(),
      },
    });
}

async function deliver(params: {
  requestId: string;
  kind: "confirmation" | "team_alert";
  to: string;
  subject: string;
  data: InvestorEmailData;
  replyTo?: string;
  auditSent:
    | "investor_interest_email.confirmation_sent"
    | "investor_interest_email.team_alert_sent";
  auditFailed:
    | "investor_interest_email.confirmation_failed"
    | "investor_interest_email.team_alert_failed";
}) {
  const { requestId, kind, to, subject, data, replyTo } = params;
  const html = await render(InvestorAccessEmail(data));

  try {
    const { id } = await sendEmail({
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    await recordEmailRow({
      requestId,
      kind,
      status: "sent",
      toEmail: to,
      subject,
      bodyHtml: html,
      providerMessageId: id,
      sentAt: new Date(),
    });
    await recordAuditEvent({
      type: params.auditSent,
      actorId: null,
      actorRole: null,
      tenant: kind === "confirmation" ? `personal:${to}` : null,
      resourceType: "investor_interest",
      resourceId: requestId,
      requestId: null,
      metadata: { to, providerMessageId: id, auto: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordEmailRow({
      requestId,
      kind,
      status: "failed",
      toEmail: to,
      subject,
      bodyHtml: html,
      error: message,
    });
    await recordAuditEvent({
      type: params.auditFailed,
      actorId: null,
      actorRole: null,
      tenant: kind === "confirmation" ? `personal:${to}` : null,
      resourceType: "investor_interest",
      resourceId: requestId,
      requestId: null,
      metadata: { to, error: message },
    });
  }
}

export async function sendInvestorConfirmation(
  requestId: string,
): Promise<void> {
  const loaded = await loadInvestorEmailData(requestId);
  if (!loaded) return;
  await deliver({
    requestId,
    kind: "confirmation",
    to: loaded.base.workEmail,
    subject: "Your investor access request has been received",
    data: { ...loaded.base, variant: "confirmation" },
    auditSent: "investor_interest_email.confirmation_sent",
    auditFailed: "investor_interest_email.confirmation_failed",
  });
}

export async function sendInvestorTeamAlert(requestId: string): Promise<void> {
  const loaded = await loadInvestorEmailData(requestId);
  if (!loaded) return;
  const { base } = loaded;
  const tag = [base.roleLabel, base.stageLabel].filter(Boolean).join(" · ");
  await deliver({
    requestId,
    kind: "team_alert",
    to: env.ASSESSMENT_TEAM_EMAIL,
    subject: `[INVESTOR${tag ? ` · ${tag}` : ""}] ${base.company}`,
    data: { ...base, variant: "team_alert" },
    replyTo: base.workEmail,
    auditSent: "investor_interest_email.team_alert_sent",
    auditFailed: "investor_interest_email.team_alert_failed",
  });
}
