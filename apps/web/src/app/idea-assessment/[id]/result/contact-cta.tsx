"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ideaLeadContactSchema } from "@/lib/idea";

/**
 * "Take this idea further" gate shown at the bottom of the result page. Collects
 * richer lead details (name / company / phone / note) and POSTs them to
 * `/api/idea-assessments/[id]/contact`.
 */
export function ContactCta({
  ideaAssessmentId,
  alreadySent,
}: {
  ideaAssessmentId: string;
  alreadySent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(alreadySent);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (done) {
    return (
      <section className="glass-card mt-8 rounded-3xl p-6 text-center sm:p-8">
        <h2 className="font-heading text-foreground text-lg font-semibold">
          Thanks — we&apos;ve got your details
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Our team will reach out to talk through your idea and what a first
          step could look like.
        </p>
      </section>
    );
  }

  return (
    <section
      className="mt-8 rounded-3xl p-6 sm:p-8"
      style={{
        background: "linear-gradient(150deg,#f0f4ff 0%,#faf0f6 100%)",
        border: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <h2 className="font-heading text-foreground text-xl font-bold">
        Want to turn this idea into reality?
      </h2>
      <p className="text-muted-foreground mt-2 max-w-lg text-sm leading-relaxed">
        Our team can help you validate the opportunity, design the solution,
        build the MVP and scale it securely. Leave your details and we&apos;ll
        set up a call.
      </p>

      {!open ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-gold mt-5 h-auto rounded-xl px-6 py-3 text-sm font-bold"
        >
          Talk to our AI experts →
        </Button>
      ) : (
        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            const payload = {
              name: String(fd.get("name") ?? "").trim(),
              company: String(fd.get("company") ?? "").trim() || undefined,
              phone: String(fd.get("phone") ?? "").trim() || undefined,
              note: String(fd.get("note") ?? "").trim() || undefined,
            };
            const parsed = ideaLeadContactSchema.safeParse(payload);
            if (!parsed.success) {
              setError("Please add your name.");
              return;
            }
            setSubmitting(true);
            try {
              const res = await fetch(
                `/api/idea-assessments/${ideaAssessmentId}/contact`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(parsed.data),
                },
              );
              if (!res.ok) {
                setError("Something went wrong — please try again.");
                return;
              }
              setDone(true);
            } catch {
              setError("Network error — please try again.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground font-medium">Name *</span>
              <Input name="name" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground font-medium">
                Company / startup
              </span>
              <Input name="company" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground font-medium">Phone</span>
              <Input name="phone" type="tel" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground font-medium">
              Anything else for the team?
            </span>
            <Textarea name="note" rows={3} />
          </label>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <div>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-gold h-auto rounded-xl px-6 py-3 text-sm font-bold"
            >
              {submitting ? "Sending…" : "Send my details"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
