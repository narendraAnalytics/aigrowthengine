import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { db, schema } from "@/server/db";
import { currentUserEmail, isStaffEmail } from "@/server/staff";

import { ApproveButton } from "./approve-button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approve client email",
};

export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  pending_approval: "Pending approval",
  approved: "Approved (sending)",
  sent: "Sent",
  failed: "Failed — retry available",
};

export default async function ApproveClientEmailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const email = await currentUserEmail();
  if (!email) redirect("/");
  if (!isStaffEmail(email)) notFound();

  const { id } = await params;

  const row = await db.query.assessmentEmails.findFirst({
    where: and(
      eq(schema.assessmentEmails.assessmentId, id),
      eq(schema.assessmentEmails.kind, "client_result"),
      isNull(schema.assessmentEmails.deletedAt),
    ),
  });
  if (!row) notFound();

  const sent = row.status === "sent";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="section-eyebrow mb-3">Client email — approval</p>
      <h1 className="font-heading text-foreground text-2xl font-bold">
        {STATUS_LABEL[row.status] ?? row.status}
      </h1>
      <dl className="text-muted-foreground mt-4 space-y-1 text-sm">
        <div>
          <span className="font-medium">To:</span> {row.toEmail}
        </div>
        <div>
          <span className="font-medium">Subject:</span> {row.subject}
        </div>
        {row.approvedBy ? (
          <div>
            <span className="font-medium">Approved by:</span> {row.approvedBy} ·{" "}
            {row.approvedAt?.toISOString()}
          </div>
        ) : null}
        {row.sentAt ? (
          <div>
            <span className="font-medium">Sent:</span>{" "}
            {row.sentAt.toISOString()} (id {row.providerMessageId})
          </div>
        ) : null}
        {row.error ? (
          <div className="text-destructive">
            <span className="font-medium">Error:</span> {row.error}
          </div>
        ) : null}
      </dl>

      <p className="text-muted-foreground mt-6 text-sm">
        This is the exact email that will be sent. Approving records you as the
        approver and delivers this stored version unchanged.
      </p>

      <iframe
        title="Client email preview"
        srcDoc={row.bodyHtml}
        className="border-border mt-4 h-[70vh] w-full rounded-lg border bg-white"
      />

      <div className="mt-6">
        <ApproveButton assessmentId={id} disabled={sent} />
      </div>
    </main>
  );
}
