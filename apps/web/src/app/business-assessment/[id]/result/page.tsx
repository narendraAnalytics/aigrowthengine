import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { NO_CONFIDENT_MATCH } from "@/lib/assessment/questions";
import { getAssessmentResult } from "@/server/assessment/get-result";

import { ExpertReviewButton } from "./expert-review-button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your assessment",
};

export const instant = false;

const BAND_LABEL: Record<string, string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const LEVEL_LABEL: Record<string, string> = {
  none: "Not evidenced",
  partial: "Partial",
  full: "Strong",
};

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const view = await getAssessmentResult(id, user.id);
  if (!view) notFound();

  if (view.status === "failed") {
    return (
      <Shell>
        <h1 className="font-heading text-foreground text-2xl font-bold">
          We couldn&apos;t complete this analysis
        </h1>
        <p className="text-muted-foreground mt-3">
          Something went wrong while assessing your problem. Please start a new
          assessment — nothing was charged or shared.
        </p>
      </Shell>
    );
  }

  if (!view.result) {
    return (
      <Shell>
        <h1 className="font-heading text-foreground text-2xl font-bold">
          Analysis in progress
        </h1>
        <p className="text-muted-foreground mt-3">
          Refresh this page in a few seconds.
        </p>
      </Shell>
    );
  }

  const { result } = view;
  const alreadyRequested = view.status === "needs_expert_review";

  return (
    <Shell>
      <p className="section-eyebrow mb-3">Opportunity assessment</p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-heading text-foreground text-3xl font-bold">
          {BAND_LABEL[result.scoreBand]} opportunity
        </h1>
        <span className="text-muted-foreground text-lg">
          Lead score {result.leadScore}/100
        </span>
      </div>

      {result.summary ? (
        <p className="text-foreground/90 mt-5 leading-relaxed">
          {result.summary}
        </p>
      ) : null}

      {result.noConfidentMatch ? (
        <section className="border-border bg-muted/30 mt-10 rounded-xl border p-6">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            {NO_CONFIDENT_MATCH.heading}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {NO_CONFIDENT_MATCH.body}
          </p>
          <div className="mt-4">
            <ExpertReviewButton
              assessmentId={view.assessmentId}
              alreadyRequested={alreadyRequested}
            />
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            Matched capabilities
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {result.matches.map((m) => (
              <article
                key={m.capabilityId}
                className="border-border rounded-xl border p-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-foreground font-semibold">{m.name}</h3>
                  <span className="text-muted-foreground text-sm">
                    {Math.round(m.confidence * 100)}% ·{" "}
                    {m.matchClass === "strong"
                      ? "strong match"
                      : "partial match"}
                  </span>
                </div>
                {m.oneLiner ? (
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    {m.oneLiner}
                  </p>
                ) : null}
                {m.rationale ? (
                  <p className="text-muted-foreground/80 mt-2 text-xs">
                    {m.rationale}
                  </p>
                ) : null}
                {m.deliveryStatus == null ? (
                  <p className="text-muted-foreground/80 mt-3 text-xs italic">
                    This capability is in discovery — we&apos;ll scope timelines
                    and outcomes with you directly rather than quote generic
                    numbers.
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      )}

      <details className="border-border mt-10 rounded-xl border p-5">
        <summary className="text-foreground cursor-pointer font-semibold">
          Why this score?
        </summary>
        <p className="text-muted-foreground mt-2 text-xs">
          Scoring model {result.scoringModelVersion}. Total is the sum of each
          factor&apos;s points (level fraction × weight).
        </p>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 pr-4 font-medium">Factor</th>
              <th className="py-1 pr-4 font-medium">Weight</th>
              <th className="py-1 pr-4 font-medium">Assessment</th>
              <th className="py-1 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((f) => (
              <tr key={f.id} className="border-border/60 border-t align-top">
                <td className="text-foreground py-2 pr-4">
                  {f.label}
                  <span className="text-muted-foreground block text-xs">
                    {f.rationale}
                  </span>
                </td>
                <td className="text-muted-foreground py-2 pr-4">{f.weight}</td>
                <td className="text-muted-foreground py-2 pr-4">
                  {LEVEL_LABEL[f.level]}
                </td>
                <td className="text-foreground py-2">{f.points}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-border border-t">
              <td className="text-foreground py-2 font-semibold" colSpan={3}>
                Total
              </td>
              <td className="text-foreground py-2 font-semibold">
                {result.leadScore}
              </td>
            </tr>
          </tfoot>
        </table>
      </details>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-2xl px-6 py-20">{children}</main>;
}
