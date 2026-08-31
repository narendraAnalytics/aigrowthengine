"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { NO_CONFIDENT_MATCH } from "@/lib/assessment/questions";

/**
 * "Request expert review" action for a low-confidence result (Slice A — STEP 5).
 * POSTs to /api/assessments/:id/expert-review, then shows a thank-you state. No
 * routing / notification behind it yet.
 */
export function ExpertReviewButton({
  assessmentId,
  alreadyRequested,
}: {
  assessmentId: string;
  alreadyRequested: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    alreadyRequested ? "done" : "idle",
  );

  if (state === "done") {
    return (
      <p className="text-muted-foreground text-sm">
        Thanks — a specialist will review your assessment and get in touch.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        disabled={state === "loading"}
        onClick={async () => {
          setState("loading");
          try {
            const res = await fetch(
              `/api/assessments/${assessmentId}/expert-review`,
              { method: "POST" },
            );
            if (!res.ok) {
              setState("error");
              return;
            }
            setState("done");
            router.refresh();
          } catch {
            setState("error");
          }
        }}
      >
        {state === "loading" ? "Sending…" : NO_CONFIDENT_MATCH.ctaLabel}
      </Button>
      {state === "error" ? (
        <p className="text-destructive text-sm" role="alert">
          Something went wrong. Please try again.
        </p>
      ) : null}
    </div>
  );
}
