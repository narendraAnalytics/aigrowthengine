"use client";

import { useEffect, useState } from "react";

import {
  IDEA_LEVEL_LABEL,
  IDEA_VERDICT_COPY,
  type IdeaDimensionBreakdown,
  type IdeaScoreBand,
  type IdeaVerdict,
} from "@/lib/idea";

/**
 * Client-side cinematic reveal of a scored idea result. Groq's JSON mode can't
 * stream, so the "animation" is a staged reveal after the data has landed:
 * score ring counts up → verdict badge scales in → summary types out →
 * dimension cards fade in one by one. All gated on `prefers-reduced-motion`.
 */

export type IdeaResultData = {
  potentialScore: number;
  band: IdeaScoreBand;
  verdict: IdeaVerdict;
  verdictReason: string;
  verdictModelVersion: string;
  summary: string | null;
  mainRisk: string | null;
  aiApproaches: string[];
  recommendedPath: string[];
  breakdown: IdeaDimensionBreakdown[];
};

const BAND_LABEL: Record<IdeaScoreBand, string> = {
  strong: "STRONG POTENTIAL",
  promising: "PROMISING",
  moderate: "MODERATE",
  weak: "EARLY / WEAK",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function CountUp({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(run ? 0 : to);
  useEffect(() => {
    if (!run) {
      setN(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <>{n}</>;
}

function TypeOut({ text, run }: { text: string; run: boolean }) {
  const [shown, setShown] = useState(run ? "" : text);
  useEffect(() => {
    if (!run) {
      setShown(text);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [text, run]);
  return <>{shown}</>;
}

function ScoreRing({
  score,
  accent,
  run,
}: {
  score: number;
  accent: string;
  run: boolean;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(run ? 0 : (score / 100) * circ);
  useEffect(() => {
    if (!run) return;
    const id = setTimeout(() => setDash((score / 100) * circ), 60);
    return () => clearTimeout(id);
  }, [score, circ, run]);

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
          style={{ transition: "stroke-dasharray 1.1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-foreground text-3xl font-bold">
          <CountUp to={score} run={run} />
        </span>
        <span className="text-muted-foreground text-[0.65rem] font-semibold tracking-[0.12em]">
          / 100
        </span>
      </div>
    </div>
  );
}

export function IdeaResultReveal({ data }: { data: IdeaResultData }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) {
      setPhase(99);
      return;
    }
    const timers = [
      setTimeout(() => setPhase((p) => Math.max(p, 1)), 150),
      setTimeout(() => setPhase((p) => Math.max(p, 2)), 1300),
      setTimeout(() => setPhase((p) => Math.max(p, 3)), 1900),
      // Safety net: if anything above is interrupted, reveal everything.
      setTimeout(() => setPhase((p) => Math.max(p, 3)), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const copy = IDEA_VERDICT_COPY[data.verdict];
  const accent = copy.accent;
  const animate = !reduced;

  return (
    <div className="flex flex-col">
      {/* VERDICT HERO */}
      <section className="glass-panel flex flex-col gap-8 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-9">
        <ScoreRing score={data.potentialScore} accent={accent} run={animate} />
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-[0.7rem] font-bold tracking-[0.14em] transition-all duration-500"
            style={{
              background: `${accent}1f`,
              color: accent,
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? "scale(1)" : "scale(0.9)",
            }}
          >
            {copy.label} · {BAND_LABEL[data.band]}
          </span>
          <h1 className="font-heading text-foreground mt-3 text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-bold">
            Potential {data.potentialScore}
            <span className="text-muted-foreground text-xl font-semibold">
              {" "}
              / 100
            </span>
          </h1>
          <p className="text-foreground/90 mt-3 leading-relaxed">
            {copy.tagline}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {data.verdictReason}
          </p>
        </div>
      </section>

      {/* SUMMARY */}
      {data.summary ? (
        <Card title="What we see">
          <p className="text-foreground/90 leading-relaxed">
            {phase >= 2 || !animate ? (
              <TypeOut text={data.summary} run={animate} />
            ) : (
              <span className="opacity-0">{data.summary}</span>
            )}
          </p>
        </Card>
      ) : null}

      {/* DIMENSIONS */}
      <Card title="How each dimension scores">
        <div className="flex flex-col gap-4">
          {data.breakdown.map((d, i) => {
            const pct = Math.round((d.points / d.weight) * 100);
            return (
              <article
                key={d.id}
                className="border-hairline bg-background/50 rounded-2xl border p-5 transition-all duration-500"
                style={{
                  opacity: phase >= 3 || !animate ? 1 : 0,
                  transform:
                    phase >= 3 || !animate
                      ? "translateY(0)"
                      : "translateY(12px)",
                  transitionDelay: animate ? `${i * 110}ms` : "0ms",
                }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-foreground font-semibold">{d.label}</h3>
                  <span
                    className="shrink-0 text-sm font-semibold"
                    style={{ color: accent }}
                  >
                    {IDEA_LEVEL_LABEL[d.level]}
                  </span>
                </div>
                <div className="bg-hairline/50 mt-3 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: accent,
                      transition: "width 0.8s ease-out",
                    }}
                  />
                </div>
                <p className="text-muted-foreground mt-3 text-sm">
                  {d.rationale}
                </p>
              </article>
            );
          })}
        </div>
      </Card>

      {/* MAIN RISK */}
      {data.mainRisk ? (
        <Card title="Biggest risk">
          <p
            className="rounded-2xl border-l-4 py-2 pl-4 leading-relaxed"
            style={{ borderColor: accent, background: `${accent}10` }}
          >
            {data.mainRisk}
          </p>
        </Card>
      ) : null}

      {/* AI APPROACHES */}
      {data.aiApproaches.length > 0 ? (
        <Card title="How AI could help">
          <p className="text-muted-foreground mb-3 text-xs">
            Illustrative building blocks — not a delivery commitment.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.aiApproaches.map((a) => (
              <span
                key={a}
                className="border-hairline text-foreground/80 rounded-full border px-3 py-1 text-sm"
              >
                {a}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {/* RECOMMENDED PATH */}
      {data.recommendedPath.length > 0 ? (
        <Card title="Recommended path">
          <ol className="text-muted-foreground space-y-2.5 text-sm">
            {data.recommendedPath.map((step, i) => (
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
        </Card>
      ) : null}

      {/* WHY THIS SCORE */}
      <details className="glass-card group mt-8 rounded-3xl p-6 sm:p-7">
        <summary className="text-foreground flex cursor-pointer items-center justify-between font-semibold">
          Why this score?
          <span className="text-muted-foreground text-sm transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <p className="text-muted-foreground mt-3 text-xs">
          Scoring model {data.verdictModelVersion}. Total is the sum of each
          dimension&apos;s points (level fraction × weight).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-4 font-medium">Dimension</th>
                <th className="py-1 pr-4 font-medium">Weight</th>
                <th className="py-1 pr-4 font-medium">Assessment</th>
                <th className="py-1 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {data.breakdown.map((d) => (
                <tr
                  key={d.id}
                  className="border-hairline/60 border-t align-top"
                >
                  <td className="text-foreground py-2 pr-4">
                    {d.label}
                    <span className="text-muted-foreground block text-xs">
                      {d.rationale}
                    </span>
                  </td>
                  <td className="text-muted-foreground py-2 pr-4">
                    {d.weight}
                  </td>
                  <td className="text-muted-foreground py-2 pr-4">
                    {IDEA_LEVEL_LABEL[d.level]}
                  </td>
                  <td className="text-foreground py-2">{d.points}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-hairline border-t">
                <td className="text-foreground py-2 font-semibold" colSpan={3}>
                  Total
                </td>
                <td className="text-foreground py-2 font-semibold">
                  {data.potentialScore}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </details>
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
