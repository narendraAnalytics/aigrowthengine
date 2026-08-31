import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BackToHome } from "@/components/back-to-home";

import { AssessmentForm } from "./assessment-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Assessment",
};

// Reads the Clerk session at request time. `instant = false` lets it block under
// `cacheComponents` without a Suspense split.
export const instant = false;

export default async function BusinessAssessmentPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <BackToHome className="mb-8" />
      <p className="section-eyebrow mb-3">AI Opportunity Assessment</p>
      <h1 className="font-heading text-foreground text-[clamp(1.9rem,4vw,2.6rem)] leading-tight font-bold">
        Describe a business problem
      </h1>
      <p className="text-muted-foreground mt-4 mb-12">
        Plain language is fine — no need to mention AI or technology.
        You&apos;ll get an explainable opportunity score and a capability-backed
        match.
      </p>
      <AssessmentForm />
    </main>
  );
}
