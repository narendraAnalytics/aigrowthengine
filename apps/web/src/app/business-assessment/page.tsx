import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Assessment",
};

// Auth-gated placeholder — reads the Clerk session (request-time). `instant =
// false` lets it block under `cacheComponents` without a Suspense split; the
// real assessment flow (Phase 3.2) will be built shell-first.
export const instant = false;

export default async function BusinessAssessmentPage() {
  const user = await currentUser();

  // Auth always returns visitors to the landing page; this route is only
  // meaningful once signed in.
  if (!user) redirect("/");

  const name =
    user.username ??
    user.firstName ??
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ??
    "there";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-24 text-center">
      <p className="section-eyebrow mb-4">AI Opportunity Assessment</p>
      <h1 className="font-heading text-cream text-[clamp(2rem,5vw,3rem)] leading-tight font-bold">
        Welcome, {name}
      </h1>
      <p className="text-cream-dim mt-5">
        Your account is ready. The guided assessment — describe a business
        problem, get an explainable opportunity score and a capability-backed
        match — is coming next.
      </p>
      <div className="mt-9">
        <Link
          href="/"
          className="btn-glass inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[0.95rem] font-semibold"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
