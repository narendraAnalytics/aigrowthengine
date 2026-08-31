import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AiOpportunitiesOptions } from "./ai-opportunities-options";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Your Path",
};

// Reads the Clerk session at request time. `instant = false` lets it block under
// `cacheComponents` without a Suspense split (mirrors business-assessment/page).
export const instant = false;

export default async function AiOpportunitiesPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  return <AiOpportunitiesOptions />;
}
