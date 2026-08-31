"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Path, type UseFormRegister } from "react-hook-form";

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

import type { Route } from "next";

/**
 * Assessment intake form (Slice A — STEP 4). Single scrolling page, three
 * grouped sections. Validation is the shared `submitAssessmentRequestSchema`
 * (derived from `ASSESSMENT_QUESTIONS`) so the form and the API never drift.
 *
 * Deferred to 3.2 hardening: multi-step wizard, progress indicator, resumable
 * localStorage draft, honeypot + Turnstile.
 */

const SECTIONS: { title: string; questionIds: string[] }[] = [
  {
    title: "The problem",
    questionIds: [
      "problem_description",
      "business_function",
      "current_cost",
      "how_handled_now",
    ],
  },
  {
    title: "Context",
    questionIds: ["systems_involved", "desired_outcome", "constraints"],
  },
  {
    title: "Timeline & scale",
    questionIds: ["timeline_budget_posture", "industry", "company_size"],
  },
];

const QUESTIONS_BY_ID = new Map(
  ASSESSMENT_QUESTIONS.map((q) => [q.id, q] as const),
);

type FormValues = SubmitAssessmentRequest;

const selectClass =
  "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3";

export function AssessmentForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(submitAssessmentRequestSchema),
    defaultValues: { answers: {} as FormValues["answers"] },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    // Drop blank optional answers so `""` / `[]` don't trip the server schema.
    const answers = Object.fromEntries(
      Object.entries(values.answers).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== "" && v != null,
      ),
    );

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
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

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-6">
          <h2 className="font-heading text-foreground text-lg font-semibold">
            {section.title}
          </h2>
          {section.questionIds.map((id) => {
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
          })}
        </section>
      ))}

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Analysing…" : "Get my assessment"}
        </Button>
        {isSubmitting ? (
          <span className="text-muted-foreground text-sm">
            This takes a few seconds.
          </span>
        ) : null}
      </div>
    </form>
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
              className="text-foreground flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                value={o.value}
                className="border-input size-4 rounded border"
                {...register(name)}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
  }
}
