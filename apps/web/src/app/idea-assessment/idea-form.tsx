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
  IDEA_QUESTIONS,
  submitIdeaRequestSchema,
  type IdeaQuestion,
  type SubmitIdeaRequest,
} from "@/lib/idea";

import { AnalyzingOverlay } from "./analyzing-overlay";

import type { Route } from "next";

/**
 * AI Idea Assessment intake — a 5-step wizard mirroring the business assessment
 * wizard (progress chips, per-step validation, analysing overlay). Validation is
 * the shared `submitIdeaRequestSchema` derived from IDEA_QUESTIONS.
 */

const SECTIONS: { title: string; blurb: string; questionIds: string[] }[] = [
  {
    title: "Your idea",
    blurb: "The one-liner and a few sentences on what it does.",
    questionIds: ["idea_oneliner", "idea_description"],
  },
  {
    title: "The problem",
    blurb: "Who hurts, how badly, and how often.",
    questionIds: ["problem", "who_has_problem", "problem_frequency"],
  },
  {
    title: "Your market",
    blurb: "The first customer, where you'd launch, and today's alternatives.",
    questionIds: [
      "target_customer",
      "launch_region",
      "existing_alternatives",
      "customer_evidence",
    ],
  },
  {
    title: "Business & tech",
    blurb: "How it makes money, what stage it's at, and the role of AI.",
    questionIds: ["monetization", "idea_stage", "needs_ai", "anything_else"],
  },
];

const STEP_TITLES = [...SECTIONS.map((s) => s.title), "Where to send it"];
const CONTACT_FIELDS = ["contact.email", "contact.name"] as const;

const QUESTIONS_BY_ID = new Map(IDEA_QUESTIONS.map((q) => [q.id, q] as const));

type FormValues = SubmitIdeaRequest;

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

export function IdeaForm({ defaultEmail = "" }: { defaultEmail?: string }) {
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
    resolver: zodResolver(submitIdeaRequestSchema),
    mode: "onTouched",
    defaultValues: {
      answers: {} as FormValues["answers"],
      contact: { email: defaultEmail },
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

    const answers = Object.fromEntries(
      Object.entries(values.answers).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== "" && v != null,
      ),
    );
    const contact = {
      email: values.contact.email,
      ...(values.contact.name ? { name: values.contact.name } : {}),
    };

    try {
      const res = await fetch("/api/idea-assessments", {
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
          "We couldn't complete the assessment. Please try again in a moment.",
        );
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/idea-assessment/${data.id}/result` as Route);
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
              : "We'll email your assessment here. Not shared with the AI model."}
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
              {isSubmitting ? "Assessing…" : "Analyze my idea"}
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
          htmlFor="contact.email"
          className="text-foreground text-sm font-medium"
        >
          Email <span className="text-muted-foreground">*</span>
        </label>
        <Input id="contact.email" type="email" {...register("contact.email")} />
        {errors.contact?.email ? (
          <p className="text-destructive text-xs" role="alert">
            {errors.contact.email.message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact.name"
          className="text-foreground text-sm font-medium"
        >
          Your name
        </label>
        <Input
          id="contact.name"
          {...register("contact.name", {
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
  question: IdeaQuestion;
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
  question: IdeaQuestion;
  register: UseFormRegister<FormValues>;
  selectClass: string;
}) {
  const name = `answers.${question.id}` as Path<FormValues>;
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
