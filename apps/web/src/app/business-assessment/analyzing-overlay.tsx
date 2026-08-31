"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen "we're working on it" overlay shown while the assessment POST is
 * in flight (a few seconds — the LLM signal call + scoring). Purely cosmetic:
 * it cycles through the real pipeline stages so the wait reads as progress, not
 * a hang. The submit logic in assessment-form.tsx is unchanged.
 */

const STAGES = [
  "Reading your problem",
  "Checking it's safe to analyse",
  "Matching capabilities we can actually deliver",
  "Scoring the opportunity",
  "Writing your explainable breakdown",
] as const;

const STAGE_MS = 1700;

/** Rendered only while a submit is in flight — mount/unmount resets its state. */
export function AnalyzingOverlay() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const timer = setInterval(() => {
      setActive((i) => Math.min(i + 1, STAGES.length - 1));
    }, STAGE_MS);
    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  const pct = Math.min(92, Math.round(((active + 1) / STAGES.length) * 100));

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center p-6 duration-300"
      style={{
        background: "rgba(28, 22, 40, 0.28)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="glass-panel animate-in zoom-in-95 w-full max-w-sm rounded-3xl p-8 text-center duration-300">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <span className="border-gold-400/20 border-t-gold-400 absolute inset-0 animate-spin rounded-full border-4" />
          <span className="bg-gold-400/15 size-7 animate-pulse rounded-full" />
        </div>

        <h2 className="font-heading text-foreground mt-5 text-lg font-semibold">
          Analysing your problem
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          This usually takes a few seconds — hang tight.
        </p>

        <div className="bg-hairline/50 mt-6 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="from-gold-300 to-gold-400 h-full rounded-full bg-linear-to-r transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="mt-6 flex flex-col gap-2.5 text-left">
          {STAGES.map((label, i) => {
            const state =
              i < active ? "done" : i === active ? "current" : "todo";
            return (
              <li
                key={label}
                className={
                  "flex items-center gap-2.5 text-sm transition-colors " +
                  (state === "todo"
                    ? "text-muted-foreground/45"
                    : "text-foreground")
                }
              >
                <span
                  className={
                    "flex size-4 flex-none items-center justify-center rounded-full text-[0.6rem] font-bold " +
                    (state === "done"
                      ? "bg-gold-400/20 text-gold-400"
                      : state === "current"
                        ? "bg-gold-400 text-[#2a1608]"
                        : "bg-hairline/50")
                  }
                >
                  {state === "done" ? "✓" : ""}
                </span>
                <span className={state === "current" ? "animate-pulse" : ""}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
