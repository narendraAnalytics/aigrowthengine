import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { BackToHome } from "@/components/back-to-home";
import { db, schema } from "@/server/db";
import { currentUserEmail, isStaffEmail } from "@/server/staff";

import { ApproveButton } from "./approve-button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client email",
};

export const instant = false;

const STATUS_META: Record<string, { label: string; fg: string; bg: string }> = {
  pending_approval: {
    label: "Pending approval",
    fg: "#9a6b00",
    bg: "rgba(227,168,63,0.16)",
  },
  approved: {
    label: "Approved · sending",
    fg: "#2563eb",
    bg: "rgba(37,99,235,0.14)",
  },
  sent: { label: "Sent to client", fg: "#1f9d6b", bg: "rgba(31,157,107,0.16)" },
  failed: {
    label: "Failed · retry below",
    fg: "#c23b52",
    bg: "rgba(194,59,82,0.14)",
  },
};

export default async function ClientEmailPage({
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
  const status = STATUS_META[row.status] ?? {
    label: row.status,
    fg: "#57606f",
    bg: "rgba(87,96,111,0.12)",
  };

  const meta: { term: string; value: string }[] = [
    { term: "To", value: row.toEmail },
    { term: "Subject", value: row.subject },
    ...(row.approvedBy
      ? [
          {
            term: "Approved by",
            value: `${row.approvedBy} · ${row.approvedAt?.toISOString() ?? ""}`,
          },
        ]
      : []),
    ...(row.sentAt
      ? [
          {
            term: "Sent",
            value: `${row.sentAt.toISOString()} · id ${row.providerMessageId ?? "—"}`,
          },
        ]
      : []),
  ];

  return (
    <main
      className="light text-foreground relative isolate min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(165deg, #f6f5fd 0%, #eef1fb 42%, #f9eef6 78%, #fef6f0 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 12% 0%, color-mix(in oklab, var(--color-magenta-400) 16%, transparent) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 100% 12%, color-mix(in oklab, var(--color-gold-400) 20%, transparent) 0%, transparent 55%)",
        }}
      />

      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <BackToHome className="mb-8" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-eyebrow mb-2">Client email</p>
            <h1 className="font-heading text-foreground text-[clamp(1.6rem,3.2vw,2.1rem)] font-bold">
              Assessment result email
            </h1>
          </div>
          <span
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold tracking-[0.08em] uppercase"
            style={{ background: status.bg, color: status.fg }}
          >
            {status.label}
          </span>
        </div>

        <div className="glass-panel mt-8 rounded-3xl p-6 sm:p-8">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[max-content_1fr]">
            {meta.map((m) => (
              <div key={m.term} className="contents">
                <dt className="text-muted-foreground text-sm font-medium">
                  {m.term}
                </dt>
                <dd className="text-foreground text-sm break-words">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>

          {row.error ? (
            <p
              className="border-destructive/30 bg-destructive/10 text-destructive mt-5 rounded-xl border px-4 py-3 text-sm"
              role="alert"
            >
              <span className="font-semibold">Error:</span> {row.error}
            </p>
          ) : null}

          <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
            The result email is sent to the client automatically once the
            assessment is scored. Use the button below only to re-send a
            delivery that failed — it sends this exact stored version and
            records you as the approver.
          </p>

          <div className="mt-6">
            <ApproveButton assessmentId={id} disabled={sent} />
          </div>
        </div>

        {/* Email preview — framed like a mail client */}
        <div className="glass-card mt-8 overflow-hidden rounded-3xl">
          <div className="border-hairline bg-background/40 flex items-center gap-2 border-b px-5 py-3">
            <span className="size-2.5 rounded-full bg-[#f87171]" />
            <span className="size-2.5 rounded-full bg-[#fbbf24]" />
            <span className="size-2.5 rounded-full bg-[#34d399]" />
            <span className="text-muted-foreground ml-3 truncate text-xs">
              {row.subject}
            </span>
          </div>
          <iframe
            title="Client email preview"
            srcDoc={row.bodyHtml}
            className="h-[68vh] w-full bg-white"
          />
        </div>
      </div>
    </main>
  );
}
