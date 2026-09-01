import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BackToHome } from "@/components/back-to-home";
import { Icon } from "@/components/landing/icons";

import { IdeaForm } from "./idea-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assess your AI idea",
};

export const instant = false;

const HIGHLIGHTS = [
  {
    icon: Icon.gauge,
    title: "A potential score you can question",
    desc: "0–100, built from five weighted signals — every point is traceable.",
  },
  {
    icon: Icon.target,
    title: "A clear verdict",
    desc: "BUILD, REFINE, VALIDATE or RETHINK — plus why, in one sentence.",
  },
  {
    icon: Icon.rocket,
    title: "A recommended path",
    desc: "The specific next steps that de-risk your idea fastest.",
  },
];

export default async function IdeaAssessmentPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";

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

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-24">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BackToHome className="mb-8" />
          <p className="section-eyebrow mb-4">AI Idea Assessment</p>
          <h1 className="font-heading text-foreground text-[clamp(2rem,4.4vw,3rem)] leading-[1.08] font-bold tracking-tight">
            Have an idea?{" "}
            <span className="text-gradient-gold">
              Let&apos;s pressure-test it.
            </span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-[0.98rem] leading-relaxed">
            Answer a few questions about the problem, the market and the
            solution. In a few seconds you&apos;ll get an explainable potential
            score, a straight verdict, and the next steps that matter most.
          </p>

          <ul className="mt-9 flex flex-col gap-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <span className="border-gold-400/30 bg-gold-400/10 text-gold-400 mt-0.5 flex size-9 flex-none items-center justify-center rounded-xl border [&_svg]:size-4">
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
            <Icon.shield className="text-gold-400 size-4 flex-none" />
            Your email is only used to send the assessment and for team
            follow-up — never sent to the AI model.
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-9">
          <IdeaForm defaultEmail={email} />
        </div>
      </div>
    </main>
  );
}
