import "server-only";

import { render } from "@react-email/components";
import { eq } from "drizzle-orm";

import { IdeaResultEmail, type IdeaEmailData } from "@/emails/idea-result";
import { env } from "@/env";
import { IDEA_VERDICT_COPY } from "@/lib/idea";
import { SITE } from "@/lib/site";
import { recordAuditEvent } from "@/server/audit/record";
import { db, schema } from "@/server/db";

import { sendEmail } from "./resend";

/**
 * Assembles, records and sends the two idea-assessment emails.
 *
 * - `client_result` — auto-sent to the address the founder entered on the form
 *   (same client-result exception as CLAUDE.md #7).
 * - `team_alert` — auto-sent to ASSESSMENT_TEAM_EMAIL.
 *
 * Both are best-effort: a send failure is recorded but never fails the pipeline.
 */

async function loadIdeaEmailData(ideaAssessmentId: string): Promise<{
  data: IdeaEmailData;
  contactEmail: string;
  teamContext: { verdict: string; score: number };
} | null> {
  const row = await db.query.ideaAssessments.findFirst({
    where: eq(schema.ideaAssessments.id, ideaAssessmentId),
    with: { result: true },
  });
  if (!row || !row.result || !row.contactEmail) return null;

  const answers = (row.answers ?? {}) as Record<string, unknown>;
  const ideaOneliner =
    typeof answers.idea_oneliner === "string"
      ? answers.idea_oneliner
      : "your idea";

  const copy = IDEA_VERDICT_COPY[row.result.verdict];

  return {
    contactEmail: row.contactEmail,
    data: {
      ideaOneliner,
      contactName: row.contactName,
      verdictLabel: copy.label,
      verdictTagline: copy.tagline,
      potentialScore: row.result.potentialScore,
      summary: row.result.summary,
      mainRisk: row.result.mainRisk,
      recommendedPath: (row.result.recommendedPath as string[]) ?? [],
      resultUrl: `${SITE.url}/idea-assessment/${ideaAssessmentId}/result`,
    },
    teamContext: {
      verdict: copy.label,
      score: row.result.potentialScore,
    },
  };
}

async function recordEmailRow(values: {
  ideaAssessmentId: string;
  kind: "client_result" | "team_alert";
  status: "sent" | "failed";
  toEmail: string;
  subject: string;
  bodyHtml: string;
  providerMessageId?: string | null;
  error?: string | null;
  sentAt?: Date | null;
}) {
  await db
    .insert(schema.ideaAssessmentEmails)
    .values({
      ideaAssessmentId: values.ideaAssessmentId,
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
        schema.ideaAssessmentEmails.ideaAssessmentId,
        schema.ideaAssessmentEmails.kind,
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

export async function sendIdeaResult(ideaAssessmentId: string): Promise<void> {
  const loaded = await loadIdeaEmailData(ideaAssessmentId);
  if (!loaded) return;
  const { data, contactEmail: toEmail } = loaded;

  const subject = `Your AI idea assessment — ${data.verdictLabel} (${data.potentialScore}/100)`;
  const html = await render(IdeaResultEmail(data));

  try {
    const { id } = await sendEmail({ to: toEmail, subject, html });
    await recordEmailRow({
      ideaAssessmentId,
      kind: "client_result",
      status: "sent",
      toEmail,
      subject,
      bodyHtml: html,
      providerMessageId: id,
      sentAt: new Date(),
    });
    await recordAuditEvent({
      type: "idea_assessment_email.client_sent",
      actorId: null,
      actorRole: null,
      tenant: `personal:${toEmail}`,
      resourceType: "idea_assessment",
      resourceId: ideaAssessmentId,
      requestId: null,
      metadata: { to: toEmail, providerMessageId: id, auto: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordEmailRow({
      ideaAssessmentId,
      kind: "client_result",
      status: "failed",
      toEmail,
      subject,
      bodyHtml: html,
      error: message,
    });
    await recordAuditEvent({
      type: "idea_assessment_email.client_failed",
      actorId: null,
      actorRole: null,
      tenant: `personal:${toEmail}`,
      resourceType: "idea_assessment",
      resourceId: ideaAssessmentId,
      requestId: null,
      metadata: { to: toEmail, error: message },
    });
  }
}

export async function sendIdeaTeamAlert(
  ideaAssessmentId: string,
): Promise<void> {
  const loaded = await loadIdeaEmailData(ideaAssessmentId);
  if (!loaded) return;
  const { data, teamContext } = loaded;

  const to = env.ASSESSMENT_TEAM_EMAIL;
  const subject = `[IDEA · ${teamContext.verdict} · ${teamContext.score}] ${data.ideaOneliner}`;
  const html = await render(IdeaResultEmail(data));

  try {
    const { id } = await sendEmail({ to, subject, html });
    await recordEmailRow({
      ideaAssessmentId,
      kind: "team_alert",
      status: "sent",
      toEmail: to,
      subject,
      bodyHtml: html,
      providerMessageId: id,
      sentAt: new Date(),
    });
    await recordAuditEvent({
      type: "idea_assessment_email.team_alert_sent",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "idea_assessment",
      resourceId: ideaAssessmentId,
      requestId: null,
      metadata: { to, providerMessageId: id },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordEmailRow({
      ideaAssessmentId,
      kind: "team_alert",
      status: "failed",
      toEmail: to,
      subject,
      bodyHtml: html,
      error: message,
    });
    await recordAuditEvent({
      type: "idea_assessment_email.team_alert_failed",
      actorId: null,
      actorRole: null,
      tenant: null,
      resourceType: "idea_assessment",
      resourceId: ideaAssessmentId,
      requestId: null,
      metadata: { error: message },
    });
  }
}
