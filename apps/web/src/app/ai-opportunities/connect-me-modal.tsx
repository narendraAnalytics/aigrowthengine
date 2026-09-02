"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { submitCallRequestSchema, type SubmitCallRequest } from "@/lib/voice";

/**
 * "Connect Me" — the short form behind the /ai-opportunities "Get a Call" CTA.
 *
 * Self-contained hard-coded palette + scoped <style> to match the rest of this
 * page (no shadcn, no `.light` scope). On submit -> POST /api/voice/call-request;
 * the AI follow-up call happens asynchronously.
 */

type Props = { open: boolean; onClose: () => void };

type Phase = "form" | "submitting" | "done" | "error";

export function ConnectMeModal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitCallRequest>({
    resolver: zodResolver(submitCallRequestSchema),
    defaultValues: {
      fullName: "",
      company: "",
      phone: "",
      email: "",
      requirement: "",
      consent: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      // reset a moment after the close animation would finish
      const t = setTimeout(() => {
        setPhase("form");
        setServerError(null);
        reset();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  if (!open) return null;

  const onSubmit = async (values: SubmitCallRequest) => {
    setPhase("submitting");
    setServerError(null);
    try {
      const res = await fetch("/api/voice/call-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setPhase("done");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong",
      );
      setPhase("error");
    }
  };

  return (
    <div
      className="cm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Request a call"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{STYLES}</style>
      <div className="cm-card">
        <button className="cm-x" onClick={onClose} aria-label="Close">
          ×
        </button>

        {phase === "done" ? (
          <div className="cm-done">
            <div className="cm-done-icon" aria-hidden>
              ✓
            </div>
            <h3 className="cm-title">Your request has been received</h3>
            <p className="cm-sub">
              Our AI assistant will call you shortly to talk through what you
              need. A member of our team follows up after.
            </p>
            <button className="cm-submit" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="cm-pill">
              <span aria-hidden>📞</span> Bored filling forms?
            </span>
            <h3 className="cm-title">Meet me instead</h3>
            <p className="cm-sub">
              Leave your number and a short note. Our AI assistant calls you,
              captures the basics, and our team takes it from there.
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="cm-form"
              noValidate
            >
              <label className="cm-field">
                <span>Full name *</span>
                <input {...register("fullName")} autoComplete="name" />
                {errors.fullName && (
                  <em className="cm-err">{errors.fullName.message}</em>
                )}
              </label>

              <label className="cm-field">
                <span>Company</span>
                <input {...register("company")} autoComplete="organization" />
                {errors.company && (
                  <em className="cm-err">{errors.company.message}</em>
                )}
              </label>

              <label className="cm-field">
                <span>Phone (with country code) *</span>
                <input
                  {...register("phone")}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <em className="cm-err">{errors.phone.message}</em>
                )}
              </label>

              <label className="cm-field">
                <span>Email</span>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                />
                {errors.email && (
                  <em className="cm-err">{errors.email.message}</em>
                )}
              </label>

              <label className="cm-field">
                <span>What do you need help with? *</span>
                <textarea {...register("requirement")} rows={3} />
                {errors.requirement && (
                  <em className="cm-err">{errors.requirement.message}</em>
                )}
              </label>

              <label className="cm-consent">
                <input type="checkbox" {...register("consent")} />
                <span>
                  I agree to receive a follow-up call from an AI assistant about
                  my request.
                </span>
              </label>
              {errors.consent && (
                <em className="cm-err">{errors.consent.message}</em>
              )}

              {serverError && (
                <em className="cm-err cm-err-server">{serverError}</em>
              )}

              <button
                type="submit"
                className="cm-submit"
                disabled={phase === "submitting"}
              >
                {phase === "submitting" ? "Sending…" : "Request a call"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const STYLES = `
.cm-overlay {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(15,17,40,0.55); backdrop-filter: blur(3px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: clamp(16px,5vh,64px) 16px; overflow-y: auto;
  animation: cmFade 0.18s ease both;
}
.cm-card {
  position: relative; width: 100%; max-width: 460px;
  background: linear-gradient(180deg,#f6f4ff 0%,#ffffff 40%);
  border-radius: 20px; padding: 30px 26px 26px;
  border: 1px solid rgba(15,23,42,0.08);
  box-shadow: 0 30px 80px rgba(20,20,60,0.35);
  color: #0f172a;
  animation: cmPop 0.22s cubic-bezier(0.2,0.8,0.3,1) both;
}
.cm-x {
  position: absolute; top: 12px; right: 14px;
  border: none; background: transparent; cursor: pointer;
  font-size: 24px; line-height: 1; color: #64708a;
}
.cm-x:hover { color: #0f172a; }
.cm-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 14px; border-radius: 100px;
  background: #ece9fb; border: 1px solid #d9d2f7;
  color: #5b21b6; font-size: 12px; font-weight: 700; letter-spacing: 0.4px;
}
.cm-title {
  font-size: 22px; font-weight: 800; margin: 14px 0 8px; letter-spacing: -0.01em;
}
.cm-sub { font-size: 13.5px; line-height: 1.55; color: #5b6478; margin: 0 0 18px; }

.cm-form { display: flex; flex-direction: column; gap: 13px; }
.cm-field { display: flex; flex-direction: column; gap: 5px; }
.cm-field > span { font-size: 12.5px; font-weight: 700; color: #33404f; }
.cm-field input, .cm-field textarea {
  border: 1px solid #d6dbe8; border-radius: 10px;
  padding: 10px 12px; font-size: 14px; font-family: inherit;
  background: #fff; color: #0f172a; resize: vertical;
}
.cm-field input:focus, .cm-field textarea:focus {
  outline: none; border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109,40,217,0.14);
}
.cm-consent {
  display: flex; gap: 9px; align-items: flex-start;
  font-size: 12.5px; line-height: 1.45; color: #445;
  margin-top: 2px;
}
.cm-consent input { margin-top: 2px; }
.cm-err { font-size: 11.5px; color: #dc2626; font-style: normal; font-weight: 600; }
.cm-err-server { margin-top: 4px; }

.cm-submit {
  margin-top: 6px; width: 100%; padding: 13px;
  border: none; border-radius: 11px; cursor: pointer;
  background: linear-gradient(90deg,#6d28d9,#4f46e5); color: #fff;
  font-size: 14.5px; font-weight: 700;
  box-shadow: 0 12px 26px rgba(79,70,229,0.32);
  transition: filter 0.15s ease, transform 0.15s ease;
}
.cm-submit:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
.cm-submit:disabled { opacity: 0.65; cursor: default; }

.cm-done { text-align: center; padding: 12px 4px 4px; }
.cm-done-icon {
  width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(22,163,74,0.12); color: #16a34a; font-size: 30px; font-weight: 800;
}

@keyframes cmFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes cmPop {
  from { opacity: 0; transform: translateY(14px) scale(0.97) }
  to { opacity: 1; transform: translateY(0) scale(1) }
}
@media (prefers-reduced-motion: reduce) {
  .cm-overlay, .cm-card { animation: none; }
}
`;
