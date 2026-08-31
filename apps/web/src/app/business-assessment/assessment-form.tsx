"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  useForm,
  type FieldErrors,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  submitAssessmentRequestSchema,
  type SubmitAssessmentRequest,
} from "@/lib/api/contract/assessment";
import {
  ASSESSMENT_QUESTIONS,
  type AssessmentQuestion,
} from "@/lib/assessment/questions";

import { AnalyzingOverlay } from "./analyzing-overlay";

import type { Route } from "next";

/**
 * Assessment intake form (Slice A — STEP 4). A four-step wizard (progress
 * indicator, one section per step, per-step validation before advancing).
 * Validation is the shared `submitAssessmentRequestSchema` (derived from
 * `ASSESSMENT_QUESTIONS`) so the form and the API never drift.
 *
 * Deferred to 3.2 hardening: resumable localStorage draft, honeypot + Turnstile.
 */

const SECTIONS: { title: string; blurb: string; questionIds: string[] }[] = [
  {
    title: "The problem",
    blurb: "Describe what's slow, costly or manual — plain language is fine.",
    questionIds: [
      "problem_description",
      "business_function",
      "current_cost",
      "how_handled_now",
    ],
  },
  {
    title: "Context",
    blurb: "What's around the problem today and where you want to get to.",
    questionIds: ["systems_involved", "desired_outcome", "constraints"],
  },
  {
    title: "Timeline & scale",
    blurb: "A rough sense of urgency and the size of the operation.",
    questionIds: ["timeline_budget_posture", "industry", "company_size"],
  },
];

const STEP_TITLES = [...SECTIONS.map((s) => s.title), "About you"];
const CONTACT_FIELDS = [
  "contact.companyName",
  "contact.workEmail",
  "contact.note",
] as const;

const QUESTIONS_BY_ID = new Map(
  ASSESSMENT_QUESTIONS.map((q) => [q.id, q] as const),
);

type FormValues = SubmitAssessmentRequest;

const selectClass =
  "border-input bg-background/60 text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus-visible:ring-3";

function StepProgress({
  step,
  total,
  onJump,
}: {
  step: number;
  total: number;
  onJump: (i: number) => void;
}) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gold-400 tracking-[0.14em] uppercase">
          Step {step + 1} of {total}
        </span>
        <span className="text-muted-foreground">{pct}% complete</span>
      </div>
      <div className="bg-hairline/60 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="from-gold-300 to-gold-400 h-full rounded-full bg-linear-to-r transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-2 gap-y-1.5">
        {STEP_TITLES.map((title, i) => {
          const state = i === step ? "current" : i < step ? "done" : "upcoming";
          return (
            <li key={title}>
              <button
                type="button"
                onClick={() => (i < step ? onJump(i) : undefined)}
                disabled={i > step}
                aria-current={state === "current" ? "step" : undefined}
                className={
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition " +
                  (state === "current"
                    ? "border-gold-400/50 bg-gold-400/12 text-gold-400"
                    : state === "done"
                      ? "border-gold-400/25 text-muted-foreground hover:text-foreground cursor-pointer"
                      : "border-hairline text-muted-foreground/60 cursor-default")
                }
              >
                <span
                  className={
                    "flex size-4 items-center justify-center rounded-full text-[0.62rem] " +
                    (state === "done"
                      ? "bg-gold-400/20 text-gold-400"
                      : state === "current"
                        ? "bg-gold-400 text-[#2a1608]"
                        : "bg-hairline/50")
                  }
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                {title}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AssessmentForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const lastStep = STEP_TITLES.length - 1;

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(submitAssessmentRequestSchema),
    mode: "onTouched",
    defaultValues: {
      answers: {} as FormValues["answers"],
      contact: { companyName: "", workEmail: "" },
    },
  });

  const stepFields = useMemo<Path<FormValues>[]>(() => {
    if (step === lastStep) return [...CONTACT_FIELDS] as Path<FormValues>[];
    return (SECTIONS[step]?.questionIds ?? []).map(
      (id) => `answers.${id}` as Path<FormValues>,
    );
  }, [step, lastStep]);

  const goNext = async () => {
    setSubmitError(null);
    const ok = await trigger(stepFields, { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, lastStep));
  };
  const goBack = () => {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    // Drop blank optional answers so `""` / `[]` don't trip the server schema.
    const answers = Object.fromEntries(
      Object.entries(values.answers).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== "" && v != null,
      ),
    );
    const contact = {
      companyName: values.contact.companyName,
      workEmail: values.contact.workEmail,
      ...(values.contact.note ? { note: values.contact.note } : {}),
    };

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, contact }),
      });
      if (res.status === 401) {
        setSubmitError("Your session expired. Please sign in again.");
        return;
      }
      if (!res.ok) {
        setSubmitError(
          "We couldn't complete the analysis. Please try again in a moment.",
        );
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/business-assessment/${data.id}/result` as Route);
    } catch {
      setSubmitError("Network error — please try again.");
    }
  });

  const fieldError = (id: string) =>
    (errors.answers as Record<string, { message?: string } | undefined>)?.[id]
      ?.message;

  const activeSection = SECTIONS[step];

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-8"
      onKeyDown={(e) => {
        // Enter in a single-line field advances the step instead of submitting
        // the whole form early. Textareas keep their normal newline behaviour.
        if (
          e.key === "Enter" &&
          step !== lastStep &&
          (e.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          void goNext();
        }
      }}
    >
      {isSubmitting ? <AnalyzingOverlay /> : null}

      <StepProgress step={step} total={STEP_TITLES.length} onJump={setStep} />

      <div
        key={step}
        className="animate-in fade-in slide-in-from-right-3 flex flex-col gap-6 duration-300"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-foreground text-xl font-semibold">
            {STEP_TITLES[step]}
          </h2>
          <p className="text-muted-foreground text-sm">
            {activeSection
              ? activeSection.blurb
              : "So our team can follow up with your assessment. Not shared with the AI model."}
          </p>
        </div>

        {activeSection ? (
          activeSection.questionIds.map((id) => {
            const q = QUESTIONS_BY_ID.get(id);
            if (!q) return null;
            return (
              <Field key={id} question={q} error={fieldError(id)}>
                <QuestionInput
                  question={q}
                  register={register}
                  selectClass={selectClass}
                />
              </Field>
            );
          })
        ) : (
          <ContactFields register={register} errors={errors} />
        )}
      </div>

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="border-hairline mt-1 flex items-center justify-between gap-4 border-t pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 0 || isSubmitting}
          className="text-muted-foreground hover:text-foreground -ml-3 disabled:pointer-events-none disabled:opacity-0"
        >
          ← Back
        </Button>

        {step === lastStep ? (
          <div className="flex items-center gap-3">
            {isSubmitting ? (
              <span className="text-muted-foreground hidden text-sm sm:inline">
                This takes a few seconds.
              </span>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-gold h-auto rounded-xl px-7 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 disabled:translate-y-0"
            >
              {isSubmitting ? "Analysing…" : "Get my assessment"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={goNext}
            className="btn-gold h-auto rounded-xl px-7 py-3.5 text-sm font-bold transition hover:-translate-y-0.5"
          >
            Continue →
          </Button>
        )}
      </div>
    </form>
  );
}

function ContactFields({
  register,
  errors,
}: {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact.companyName"
          className="text-foreground text-sm font-medium"
        >
          Company name <span className="text-muted-foreground">*</span>
        </label>
        <Input id="contact.companyName" {...register("contact.companyName")} />
        {errors.contact?.companyName ? (
          <p className="text-destructive text-xs" role="alert">
            {errors.contact.companyName.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact.workEmail"
          className="text-foreground text-sm font-medium"
        >
          Work email <span className="text-muted-foreground">*</span>
        </label>
        <Input
          id="contact.workEmail"
          type="email"
          {...register("contact.workEmail")}
        />
        {errors.contact?.workEmail ? (
          <p className="text-destructive text-xs" role="alert">
            {errors.contact.workEmail.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact.note"
          className="text-foreground text-sm font-medium"
        >
          Anything else for the team?
        </label>
        <Textarea
          id="contact.note"
          rows={3}
          {...register("contact.note", {
            setValueAs: (v: unknown) => (v === "" ? undefined : v),
          })}
        />
      </div>
    </>
  );
}

function Field({
  question,
  error,
  children,
}: {
  question: AssessmentQuestion;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`answers.${question.id}`}
        className="text-foreground text-sm font-medium"
      >
        {question.label}
        {question.required ? (
          <span className="text-muted-foreground"> *</span>
        ) : null}
      </label>
      {question.helpText ? (
        <p className="text-muted-foreground text-xs">{question.helpText}</p>
      ) : null}
      {children}
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function QuestionInput({
  question,
  register,
  selectClass,
}: {
  question: AssessmentQuestion;
  register: UseFormRegister<FormValues>;
  selectClass: string;
}) {
  const name = `answers.${question.id}` as Path<FormValues>;
  // Blank optional text -> undefined, so `z.string().min(1).optional()` passes.
  const textOpts =
    !question.required && question.type !== "multi_select"
      ? { setValueAs: (v: unknown) => (v === "" ? undefined : v) }
      : undefined;

  switch (question.type) {
    case "long_text":
      return <Textarea id={name} rows={4} {...register(name, textOpts)} />;
    case "short_text":
      return <Input id={name} {...register(name, textOpts)} />;
    case "single_select":
      return (
        <select id={name} className={selectClass} {...register(name)}>
          <option value="">Select…</option>
          {(question.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "multi_select":
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((o) => (
            <label
              key={o.value}
              className="border-hairline bg-background/40 text-foreground hover:border-gold-400/40 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition"
            >
              <input
                type="checkbox"
                value={o.value}
                className="border-input accent-gold-400 size-4 rounded border"
                {...register(name)}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
  }
}
