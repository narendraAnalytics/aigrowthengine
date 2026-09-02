import "server-only";

import { render } from "@react-email/components";
import { eq } from "drizzle-orm";

import { VoiceCallEmail, type VoiceEmailData } from "@/emails/voice-call";
import { env } from "@/env";
import { SITE } from "@/lib/site";
import { voiceCallOutcomeLabel } from "@/lib/voice";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import { sendEmail } from "./resend";

/**
 * Assembles, records and sends the voice "Call Me" emails. All best-effort — a
 * send failure is recorded (row + audit) but never fails the pipeline.
 *
 * Rows in `voice_call_emails` key on the business `request_id` (uuid), matching
 * the FK in the schema. One row per (request, kind).
 */

type EmailKind = "confirmation" | "team_alert" | "team_summary";

export function voiceTeamEmail(): string {
  return env.VOICE_TEAM_EMAIL ?? env.ASSESSMENT_TEAM_EMAIL;
}

type Base = Omit<VoiceEmailData, "variant">;

async function loadBase(requestId: string): Promise<Base | null> {
  const row = await db.query.voiceCallRequests.findFirst({
    where: eq(schema.voiceCallRequests.requestId, requestId),
  });
  if (!row) return null;

  const transcript = Array.isArray(row.transcript)
    ? (row.transcript as { role: string; text: string }[])
    : null;

  return {
    fullName: row.fullName,
    company: row.company,
    phoneE164: row.phoneE164,
    email: row.email,
    requirement: row.requirement,
    siteUrl: SITE.url,
    outcomeLabel: voiceCallOutcomeLabel(row.outcome),
    durationSeconds: row.durationSeconds,
    callStatus: row.callStatus,
    summary: row.summary,
    transcript,
  };
}

async function recordEmailRow(values: {
  requestId: string;
  kind: EmailKind;
  status: "sent" | "failed";
  toEmail: string;
  subject: string;
  bodyHtml: string;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}) {
  await db
    .insert(schema.voiceCallEmails)
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
      target: [schema.voiceCallEmails.requestId, schema.voiceCallEmails.kind],
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

type AuditPair = {
  sent:
    | "voice_call_email.confirmation_sent"
    | "voice_call_email.team_alert_sent"
    | "voice_call_email.team_summary_sent";
  failed:
    | "voice_call_email.confirmation_failed"
    | "voice_call_email.team_alert_failed"
    | "voice_call_email.team_summary_failed";
};

async function deliver(params: {
  requestId: string;
  kind: EmailKind;
  to: string;
  subject: string;
  data: VoiceEmailData;
  replyTo?: string;
  audit: AuditPair;
}) {
  const { requestId, kind, to, subject, data, replyTo, audit } = params;
  const html = await render(VoiceCallEmail(data));

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
      type: audit.sent,
      actorId: null,
      actorRole: null,
      tenant: kind === "confirmation" ? `personal:${to}` : null,
      resourceType: "voice_call_request",
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
      type: audit.failed,
      actorId: null,
      actorRole: null,
      tenant: kind === "confirmation" ? `personal:${to}` : null,
      resourceType: "voice_call_request",
      resourceId: requestId,
      requestId: null,
      metadata: { to, error: message },
    });
  }
}

export async function sendVoiceConfirmation(requestId: string): Promise<void> {
  const base = await loadBase(requestId);
  if (!base || !base.email) return; // no address entered -> nothing to send
  await deliver({
    requestId,
    kind: "confirmation",
    to: base.email,
    subject: "We've got your request — our AI assistant will call you shortly",
    data: { ...base, variant: "confirmation" },
    audit: {
      sent: "voice_call_email.confirmation_sent",
      failed: "voice_call_email.confirmation_failed",
    },
  });
}

export async function sendVoiceTeamAlert(requestId: string): Promise<void> {
  const base = await loadBase(requestId);
  if (!base) return;
  await deliver({
    requestId,
    kind: "team_alert",
    to: voiceTeamEmail(),
    subject: `[CALL ME] ${base.fullName}${base.company ? ` · ${base.company}` : ""}`,
    data: { ...base, variant: "team_alert" },
    ...(base.email ? { replyTo: base.email } : {}),
    audit: {
      sent: "voice_call_email.team_alert_sent",
      failed: "voice_call_email.team_alert_failed",
    },
  });
}

export async function sendVoiceTeamSummary(requestId: string): Promise<void> {
  const base = await loadBase(requestId);
  if (!base) return;
  await deliver({
    requestId,
    kind: "team_summary",
    to: voiceTeamEmail(),
    subject: `[CALL OUTCOME · ${base.outcomeLabel ?? "n/a"}] ${base.fullName}`,
    data: { ...base, variant: "team_summary" },
    ...(base.email ? { replyTo: base.email } : {}),
    audit: {
      sent: "voice_call_email.team_summary_sent",
      failed: "voice_call_email.team_summary_failed",
    },
  });
}
