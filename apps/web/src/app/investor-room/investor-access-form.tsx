"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  INVESTOR_GEOGRAPHIES,
  INVESTOR_INTERESTS,
  INVESTOR_ROLES,
  INVESTOR_STAGES,
  submitInvestorInterestSchema,
  type SubmitInvestorInterest,
} from "@/lib/investor";

type FormValues = SubmitInvestorInterest;

export function InvestorAccessForm() {
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(submitInvestorInterestSchema),
    mode: "onTouched",
    defaultValues: { interests: [] },
  });

  // A "" selection means "not provided" — drop it so the optional enum passes.
  const optionalSelect = {
    setValueAs: (v: unknown) => (v === "" ? undefined : v),
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/investor-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setSubmitError(
          "We couldn't submit your request. Please try again in a moment.",
        );
        return;
      }
      setDone(true);
    } catch {
      setSubmitError("Network error — please try again.");
    }
  });

  if (done) {
    return (
      <div className="ir-thanks">
        <div className="ir-thanks-mark" aria-hidden>
          ✓
        </div>
        <h3>Thank you — request received</h3>
        <p>
          We&apos;ll review your information and get back to you with the
          appropriate company and investment materials. A confirmation is on its
          way to your inbox.
        </p>
        <div className="ir-thanks-links">
          <span>While you wait</span>
          <a href="/ai-opportunities">Explore the platform →</a>
          <a href="#technology">Revisit the technology →</a>
          <a href="#traction">See our progress →</a>
        </div>
      </div>
    );
  }

  return (
    <form className="ir-form" onSubmit={onSubmit} noValidate>
      <div className="ir-form-grid">
        <label className="ir-field">
          <span>
            Full name <em>*</em>
          </span>
          <input type="text" autoComplete="name" {...register("fullName")} />
          {errors.fullName ? (
            <small role="alert">{errors.fullName.message}</small>
          ) : null}
        </label>

        <label className="ir-field">
          <span>
            Work email <em>*</em>
          </span>
          <input type="email" autoComplete="email" {...register("workEmail")} />
          {errors.workEmail ? (
            <small role="alert">{errors.workEmail.message}</small>
          ) : null}
        </label>

        <label className="ir-field ir-field-wide">
          <span>
            Company / fund <em>*</em>
          </span>
          <input
            type="text"
            autoComplete="organization"
            {...register("company")}
          />
          {errors.company ? (
            <small role="alert">{errors.company.message}</small>
          ) : null}
        </label>

        <label className="ir-field">
          <span>Your role</span>
          <select defaultValue="" {...register("role", optionalSelect)}>
            <option value="">Select…</option>
            {INVESTOR_ROLES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ir-field">
          <span>Investment stage</span>
          <select defaultValue="" {...register("stage", optionalSelect)}>
            <option value="">Select…</option>
            {INVESTOR_STAGES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ir-field">
          <span>Investment geography</span>
          <select defaultValue="" {...register("geography", optionalSelect)}>
            <option value="">Select…</option>
            {INVESTOR_GEOGRAPHIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="ir-checks">
        <legend>What are you interested in?</legend>
        <div className="ir-checks-grid">
          {INVESTOR_INTERESTS.map((o) => (
            <label key={o.value} className="ir-check">
              <input
                type="checkbox"
                value={o.value}
                {...register("interests")}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="ir-field">
        <span>What would you like to learn more about?</span>
        <textarea rows={3} {...register("learnMore")} />
      </label>

      {submitError ? (
        <p className="ir-form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        className="ir-btn ir-btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting…" : "Request Investor Access →"}
      </button>
      <p className="ir-form-fine">
        Your details are used only to share the appropriate investor materials —
        never sent to any AI model. This is not an offer of securities.
      </p>
    </form>
  );
}
