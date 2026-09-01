import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BackToHome } from "@/components/back-to-home";
import { getIdeaResult } from "@/server/idea-assessment/get-idea-result";

import { ContactCta } from "./contact-cta";
import { IdeaResultReveal } from "./idea-result-reveal";

import type { Metadata, Route } from "next";

export const metadata: Metadata = {
  title: "Your idea assessment",
};

export const instant = false;

export default async function IdeaResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const view = await getIdeaResult(id, user.id);
  if (!view) notFound();

  if (view.status === "failed") {
    return (
      <Shell>
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <h1 className="font-heading text-foreground text-2xl font-bold">
            We couldn&apos;t complete this assessment
          </h1>
          <p className="text-muted-foreground mt-3">
            Something went wrong while assessing your idea. Please start a new
            assessment — nothing was charged or shared.
          </p>
          <Link
            href={"/idea-assessment" as Route}
            className="btn-glass mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
          >
            Start over
          </Link>
        </div>
      </Shell>
    );
  }

  if (!view.result) {
    return (
      <Shell>
        <div className="glass-panel rounded-3xl p-8 sm:p-10">
          <h1 className="font-heading text-foreground text-2xl font-bold">
            Assessment in progress
          </h1>
          <p className="text-muted-foreground mt-3">
            Refresh this page in a few seconds.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="section-eyebrow mb-4">AI idea assessment</p>

      <IdeaResultReveal data={view.result} />

      <ContactCta
        ideaAssessmentId={view.ideaAssessmentId}
        alreadySent={view.hasLeadContact}
      />

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href={"/#top" as Route}
          className="btn-glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
        >
          Back to home
        </Link>
        <Link
          href={"/idea-assessment" as Route}
          className="border-hairline text-foreground hover:bg-background/60 inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors"
        >
          Assess another idea
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
