import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BackToHome } from "@/components/back-to-home";
import { NO_CONFIDENT_MATCH } from "@/lib/assessment/questions";
import { getAssessmentResult } from "@/server/assessment/get-result";

import { ExpertReviewButton } from "./expert-review-button";

import type { Metadata, Route } from "next";

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

const BAND_ACCENT: Record<string, string> = {
  high: "#1f9d6b",
  medium: "#e3a83f",
  low: "#c06b8f",
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
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <h1 className="font-heading text-foreground text-2xl font-bold">
            We couldn&apos;t complete this analysis
          </h1>
          <p className="text-muted-foreground mt-3">
            Something went wrong while assessing your problem. Please start a
            new assessment — nothing was charged or shared.
          </p>
        </div>
      </Shell>
    );
  }

  if (!view.result) {
    return (
      <Shell>
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <h1 className="font-heading text-foreground text-2xl font-bold">
            Analysis in progress
          </h1>
          <p className="text-muted-foreground mt-3">
            Refresh this page in a few seconds.
          </p>
        </div>
      </Shell>
    );
  }

  const { result } = view;
  const alreadyRequested = view.status === "needs_expert_review";
  const accent = BAND_ACCENT[result.scoreBand] ?? "#e3a83f";

  return (
    <Shell>
      <p className="section-eyebrow mb-4">Opportunity assessment</p>

      {/* SCORE HERO */}
      <section className="glass-panel flex flex-col gap-8 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-9">
        <ScoreRing score={result.leadScore} accent={accent} />
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.14em]"
            style={{ background: `${accent}1f`, color: accent }}
          >
            {BAND_LABEL[result.scoreBand]} OPPORTUNITY
          </span>
          <h1 className="font-heading text-foreground mt-3 text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-bold">
            Lead score {result.leadScore}
            <span className="text-muted-foreground text-xl font-semibold">
              {" "}
              / 100
            </span>
          </h1>
          {result.summary ? (
            <p className="text-foreground/90 mt-4 leading-relaxed">
              {result.summary}
            </p>
          ) : null}
        </div>
      </section>

      {result.narrative ? (
        <Card title="How our AI team would approach this">
          <p className="text-foreground/90 leading-relaxed">
            {result.narrative.summary}
          </p>
          {result.narrative.steps.length > 0 ? (
            <ol className="text-muted-foreground mt-4 space-y-2.5 text-sm">
              {result.narrative.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full text-[0.68rem] font-bold"
                    style={{ background: `${accent}1f`, color: accent }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          ) : null}
        </Card>
      ) : null}

      {result.noConfidentMatch ? (
        <Card title={NO_CONFIDENT_MATCH.heading}>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {NO_CONFIDENT_MATCH.body}
          </p>
          <div className="mt-5">
            <ExpertReviewButton
              assessmentId={view.assessmentId}
              alreadyRequested={alreadyRequested}
            />
          </div>
        </Card>
      ) : (
        <Card title="Matched capabilities">
          <div className="flex flex-col gap-4">
            {result.matches.map((m) => (
              <article
                key={m.capabilityId}
                className="border-hairline bg-background/50 rounded-2xl border p-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-foreground font-semibold">{m.name}</h3>
                  <span className="text-muted-foreground shrink-0 text-sm">
                    {Math.round(m.confidence * 100)}% ·{" "}
                    {m.matchClass === "strong"
                      ? "strong match"
                      : "partial match"}
                  </span>
                </div>
                <div className="bg-hairline/50 mt-3 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(m.confidence * 100)}%`,
                      background: accent,
                    }}
                  />
                </div>
                {m.oneLiner ? (
                  <p className="text-muted-foreground mt-3 text-sm">
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
        </Card>
      )}

      <details className="glass-card group mt-8 rounded-3xl p-6 sm:p-7">
        <summary className="text-foreground flex cursor-pointer items-center justify-between font-semibold">
          Why this score?
          <span className="text-muted-foreground text-sm transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <p className="text-muted-foreground mt-3 text-xs">
          Scoring model {result.scoringModelVersion}. Total is the sum of each
          factor&apos;s points (level fraction × weight).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
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
                <tr
                  key={f.id}
                  className="border-hairline/60 border-t align-top"
                >
                  <td className="text-foreground py-2 pr-4">
                    {f.label}
                    <span className="text-muted-foreground block text-xs">
                      {f.rationale}
                    </span>
                  </td>
                  <td className="text-muted-foreground py-2 pr-4">
                    {f.weight}
                  </td>
                  <td className="text-muted-foreground py-2 pr-4">
                    {LEVEL_LABEL[f.level]}
                  </td>
                  <td className="text-foreground py-2">{f.points}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-hairline border-t">
                <td className="text-foreground py-2 font-semibold" colSpan={3}>
                  Total
                </td>
                <td className="text-foreground py-2 font-semibold">
                  {result.leadScore}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </details>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href={"/#top" as Route}
          className="btn-glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          Back to home
        </Link>
        <Link
          href="/business-assessment"
          className="border-hairline text-foreground hover:bg-background/60 inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors"
        >
          Start another assessment
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <BackToHome className="mb-8" />
        {children}
      </div>
    </main>
  );
}

function ScoreRing({ score, accent }: { score: number; accent: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="relative flex size-32 flex-none items-center justify-center sm:size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-foreground text-3xl font-bold">
          {score}
        </span>
        <span className="text-muted-foreground text-[0.65rem] font-semibold tracking-[0.12em]">
          / 100
        </span>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card mt-8 rounded-3xl p-6 sm:p-7">
      <h2 className="font-heading text-foreground text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
