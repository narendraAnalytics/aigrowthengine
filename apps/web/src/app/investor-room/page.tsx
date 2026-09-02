import { InvestorRoom } from "./investor-room";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Room",
  description:
    "AI Growth Engine — building the infrastructure for AI-powered business growth. Company vision, platform, technology, traction, roadmap and investment opportunity.",
};

/**
 * Public Investor Room (V1). A self-contained investor presentation that ends in
 * the "Request Investor Access" form. The gated data room (Level 2) is deferred
 * to Phase 7 — see `src/lib/security/investor-access.ts`.
 */
export default function InvestorRoomPage() {
  return <InvestorRoom />;
}
