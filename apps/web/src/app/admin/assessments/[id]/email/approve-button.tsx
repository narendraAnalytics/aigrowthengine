"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Approve + send the client result email. The click is the recorded human
 * approval (CLAUDE.md #7) — the server sends exactly the stored draft.
 */
export function ApproveButton({
  assessmentId,
  disabled,
}: {
  assessmentId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <p className="text-sm font-medium text-green-700 dark:text-green-400">
        Sent to the client.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        disabled={disabled || state === "sending"}
        onClick={async () => {
          setState("sending");
          setMessage(null);
          try {
            const res = await fetch(
              `/api/assessments/${assessmentId}/client-email`,
              { method: "POST" },
            );
            const data = (await res.json().catch(() => ({}))) as {
              status?: string;
              error?: string;
            };
            if (!res.ok) {
              setState("error");
              setMessage(data.error ?? "Send failed.");
              return;
            }
            setState("sent");
            router.refresh();
          } catch {
            setState("error");
            setMessage("Network error.");
          }
        }}
      >
        {state === "sending" ? "Sending…" : "Approve & send to client"}
      </Button>
      {message ? (
        <p className="text-destructive text-sm" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
