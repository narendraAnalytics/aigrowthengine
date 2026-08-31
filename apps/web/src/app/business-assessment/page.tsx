import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BackToHome } from "@/components/back-to-home";
import { Icon } from "@/components/landing/icons";

import { AssessmentForm } from "./assessment-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Assessment",
};

// Reads the Clerk session at request time. `instant = false` lets it block under
// `cacheComponents` without a Suspense split.
export const instant = false;

const HIGHLIGHTS = [
  {
    icon: Icon.gauge,
    title: "An explainable opportunity score",
    desc: "A number you can question — every point is traceable to a signal.",
  },
  {
    icon: Icon.target,
    title: "A capability-backed match",
    desc: "Matched only to solutions we can actually deliver — never invented.",
  },
  {
    icon: Icon.shield,
    title: "An honest answer when it's not a fit",
    desc: "Low confidence gets a straight “not yet” and a route to an expert.",
  },
];

export default async function BusinessAssessmentPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <main className="relative isolate overflow-hidden">
      {/* soft brand glow behind the two-column layout */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 15% 0%, color-mix(in oklab, var(--color-magenta-400) 18%, transparent) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 20%, color-mix(in oklab, var(--color-gold-400) 16%, transparent) 0%, transparent 55%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-24">
        {/* LEFT — narrative */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BackToHome className="mb-8" />
          <p className="section-eyebrow mb-4">AI Opportunity Assessment</p>
          <h1 className="font-heading text-foreground text-[clamp(2rem,4.4vw,3rem)] leading-[1.08] font-bold tracking-tight">
            Describe a business{" "}
            <span className="text-gradient-gold">problem</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-[0.98rem] leading-relaxed">
            Plain language is fine — no need to mention AI or technology.
            You&apos;ll get an explainable opportunity score and a
            capability-backed match in a few seconds.
          </p>

          <ul className="mt-9 flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <span className="border-gold-400/30 bg-gold-400/10 text-gold-300 mt-0.5 flex size-9 flex-none items-center justify-center rounded-xl border [&_svg]:size-4">
                  <h.icon />
                </span>
                <span>
                  <span className="text-foreground block text-sm font-semibold">
                    {h.title}
                  </span>
                  <span className="text-muted-foreground block text-[0.82rem] leading-relaxed">
                    {h.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="glass-card text-muted-foreground mt-9 flex items-center gap-3 rounded-2xl px-4 py-3 text-xs">
            <Icon.shield className="text-gold-300 size-4 flex-none" />
            Your contact details are only used for team follow-up — never sent
            to the AI model.
          </div>
        </div>

        {/* RIGHT — form panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-9">
          <AssessmentForm />
        </div>
      </div>
    </main>
  );
}
