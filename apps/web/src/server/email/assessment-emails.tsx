import "server-only";

import { createHash } from "node:crypto";

import { render } from "@react-email/components";
import { and, eq, isNull } from "drizzle-orm";

import { ClientResultEmail } from "@/emails/client-result";
import { TeamAlertEmail } from "@/emails/team-alert";
import { env } from "@/env";
import { getCapability } from "@/lib/capabilities";
import {
  computeLeadScore,
  parseLeadSignals,
  type LeadSignals,
} from "@/lib/scoring";
import { SITE } from "@/lib/site";
import { parseNarrative } from "@/server/ai/solution-narrative";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import { EmailSendError, sendEmail } from "./resend";

import type { AssessmentEmailData, AssessmentEmailMatch } from "@/emails/types";

/**
 * Assembles, records, and sends the two assessment emails (Phase 3).
 *
 * - `team_alert` — sent automatically to `ASSESSMENT_TEAM_EMAIL`.
 * - `client_result` — sent automatically to the email the client entered on the
 *   form (`sendClientResult`). `approveAndSendClientEmail` remains as a
 *   staff-triggered resend for the `failed` case.
 */

function bodyHash(to: string, subject: string, html: string): string {
  return createHash("sha256")
    .update(`${to}\n${subject}\n${html}`)
    .digest("hex");
}

async function loadEmailData(
  assessmentId: string,
): Promise<AssessmentEmailData | null> {
  const row = await db.query.assessments.findFirst({
    where: eq(schema.assessments.id, assessmentId),
    with: { result: { with: { matches: true } } },
  });
  if (!row || !row.result || !row.contactEmail) return null;

  const signals = parseLeadSignals(row.result.signals as LeadSignals);
  const { breakdown } = computeLeadScore(signals);

  const matches: AssessmentEmailMatch[] = [...row.result.matches]
    .sort((a, b) => a.rank - b.rank)
    .map((m) => {
      const cap = getCapability(m.capabilityId);
      return {
        name: cap?.name ?? m.capabilityId,
        oneLiner: cap?.oneLiner ?? "",
        confidencePct: Math.round(Number(m.confidence) * 100),
        matchClass: m.matchClass,
        inDiscovery: (cap?.deliveryStatus ?? null) == null,
      };
    });

  const narrative = parseNarrative(row.result.solutionNarrative);

  return {
    company: row.contactCompany ?? "Unknown company",
    contactEmail: row.contactEmail,
    contactNote: row.contactNote,
    band: row.result.scoreBand,
    score: row.result.leadScore,
    summary: row.result.summary,
    narrative,
    matches,
    breakdown: breakdown.map((f) => ({
      label: f.label,
      weight: f.weight,
      level: f.level,
      points: f.points,
      rationale: f.rationale,
    })),
    noConfidentMatch: row.result.noConfidentMatch,
    resultUrl: `${SITE.url}/business-assessment/${assessmentId}/result`,
    approvalUrl: `${SITE.url}/admin/assessments/${assessmentId}/email`,
  };
}

async function upsertEmailRow(values: {
  assessmentId: string;
  kind: "team_alert" | "client_result";
  status: "pending_approval" | "approved" | "sent" | "failed";
  toEmail: string;
  subject: string;
  bodyHtml: string;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}) {
  const hash = bodyHash(values.toEmail, values.subject, values.bodyHtml);
  await db
    .insert(schema.assessmentEmails)
    .values({
      assessmentId: values.assessmentId,
      kind: values.kind,
      status: values.status,
      toEmail: values.toEmail,
      subject: values.subject,
      bodyHtml: values.bodyHtml,
      bodyHash: hash,
      providerMessageId: values.providerMessageId ?? null,
      error: values.error ?? null,
      sentAt: values.sentAt ?? null,
    })
    .onConflictDoUpdate({
      target: [
        schema.assessmentEmails.assessmentId,
        schema.assessmentEmails.kind,
      ],
      set: {
        status: values.status,
        subject: values.subject,
        bodyHtml: values.bodyHtml,
        bodyHash: hash,
        providerMessageId: values.providerMessageId ?? null,
        error: values.error ?? null,
        sentAt: values.sentAt ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function sendTeamAlert(assessmentId: string): Promise<void> {
  const data = await loadEmailData(assessmentId);
  if (!data) return;

  const to = env.ASSESSMENT_TEAM_EMAIL;
  const subject = `[${data.band.toUpperCase()} · ${data.score}] ${data.company} — new assessment`;
  const html = await render(TeamAlertEmail(data));

  try {
    const { id } = await sendEmail({
      to,
      subject,
      html,
      replyTo: data.contactEmail,
    });
    await upsertEmailRow({
      assessmentId,
      kind: "team_alert",
      status: "sent",
      toEmail: to,
      subject,
      bodyHtml: html,
      providerMessageId: id,
      sentAt: new Date(),
    });
    await recordAuditEvent({
      type: "assessment_email.team_alert_sent",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "assessment",
      resourceId: assessmentId,
      requestId: null,
      metadata: { to, providerMessageId: id },
    });
  } catch (err) {
    await upsertEmailRow({
      assessmentId,
      kind: "team_alert",
      status: "failed",
      toEmail: to,
      subject,
      bodyHtml: html,
      error: err instanceof Error ? err.message : String(err),
    });
    await recordAuditEvent({
      type: "assessment_email.team_alert_failed",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "assessment",
      resourceId: assessmentId,
      requestId: null,
      metadata: { error: err instanceof Error ? err.message : String(err) },
    });
  }
}

/**
 * Sends the result email to the address the client entered on the form,
 * automatically, right after the assessment is scored. Best-effort: a send
 * failure is recorded (`status: "failed"`) but never fails the assessment.
 * A staff member can retry a failed one from the admin approval page.
 */
export async function sendClientResult(assessmentId: string): Promise<void> {
  const data = await loadEmailData(assessmentId);
  if (!data) return;

  const to = data.contactEmail;
  const subject = data.noConfidentMatch
    ? "We've received your assessment"
    : `Your AI opportunity assessment — ${data.band.toUpperCase()} opportunity`;
  const html = await render(ClientResultEmail(data));

  try {
    const { id } = await sendEmail({ to, subject, html });
    await upsertEmailRow({
      assessmentId,
      kind: "client_result",
      status: "sent",
      toEmail: to,
      subject,
      bodyHtml: html,
      providerMessageId: id,
      sentAt: new Date(),
    });
    await recordAuditEvent({
      type: "assessment_email.client_sent",
      actorId: null,
      actorRole: null,
      tenant: `personal:${to}`,
      resourceType: "assessment",
      resourceId: assessmentId,
      requestId: null,
      metadata: { to, providerMessageId: id, auto: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await upsertEmailRow({
      assessmentId,
      kind: "client_result",
      status: "failed",
      toEmail: to,
      subject,
      bodyHtml: html,
      error: message,
    });
    await recordAuditEvent({
      type: "assessment_email.client_failed",
      actorId: null,
      actorRole: null,
      tenant: `personal:${to}`,
      resourceType: "assessment",
      resourceId: assessmentId,
      requestId: null,
      metadata: { to, error: message },
    });
  }
}

export class ClientEmailApprovalError extends Error {}

export async function approveAndSendClientEmail(params: {
  assessmentId: string;
  approverEmail: string;
}): Promise<{ status: "sent" | "already_sent" }> {
  const { assessmentId, approverEmail } = params;

  const row = await db.query.assessmentEmails.findFirst({
    where: and(
      eq(schema.assessmentEmails.assessmentId, assessmentId),
      eq(schema.assessmentEmails.kind, "client_result"),
      isNull(schema.assessmentEmails.deletedAt),
    ),
  });
  if (!row) throw new ClientEmailApprovalError("no client email draft");
  if (row.status === "sent") return { status: "already_sent" };

  const currentHash = bodyHash(row.toEmail, row.subject, row.bodyHtml);
  const now = new Date();

  await db
    .update(schema.assessmentEmails)
    .set({
      status: "approved",
      approvedBy: approverEmail,
      approvedAt: now,
      approvedHash: currentHash,
      updatedAt: now,
    })
    .where(eq(schema.assessmentEmails.id, row.id));

  await recordAuditEvent({
    type: "assessment_email.client_approved",
    actorId: approverEmail,
    actorRole: "staff",
    tenant: `personal:${row.toEmail}`,
    resourceType: "assessment_email",
    resourceId: row.id,
    requestId: null,
    metadata: { assessmentId, approvedHash: currentHash },
  });

  try {
    const { id } = await sendEmail({
      to: row.toEmail,
      subject: row.subject,
      html: row.bodyHtml,
    });
    await db
      .update(schema.assessmentEmails)
      .set({
        status: "sent",
        sentAt: new Date(),
        providerMessageId: id,
        updatedAt: new Date(),
      })
      .where(eq(schema.assessmentEmails.id, row.id));
    await recordAuditEvent({
      type: "assessment_email.client_sent",
      actorId: approverEmail,
      actorRole: "staff",
      tenant: `personal:${row.toEmail}`,
      resourceType: "assessment_email",
      resourceId: row.id,
      requestId: null,
      metadata: { assessmentId, providerMessageId: id },
    });
    return { status: "sent" };
  } catch (err) {
    const message = err instanceof EmailSendError ? err.message : String(err);
    await db
      .update(schema.assessmentEmails)
      .set({ status: "failed", error: message, updatedAt: new Date() })
      .where(eq(schema.assessmentEmails.id, row.id));
    await recordAuditEvent({
      type: "assessment_email.client_failed",
      actorId: approverEmail,
      actorRole: "staff",
      tenant: `personal:${row.toEmail}`,
      resourceType: "assessment_email",
      resourceId: row.id,
      requestId: null,
      metadata: { assessmentId, error: message },
    });
    throw new ClientEmailApprovalError(`send failed: ${message}`);
  }
}
