import { z } from "zod";

/**
 * Contract for the "Connect Me" voice follow-up form (V1, "Get a Call" path).
 *
 *   POST /api/voice/call-request   capture a call request + trigger the AI call
 *
 * Phone is the only hard-required contact field. Consent MUST be true — the
 * server rejects a submission without it. Free-text (`requirement`) is stored,
 * emailed to the team, and passed to the Sarvam voice agent as an agent
 * variable; it is NEVER sent to an LLM, so no prompt-injection screening runs.
 */

/**
 * Lenient E.164-ish check: optional leading "+", 8–15 digits. We normalise
 * separators away first. India numbers default to +91 in the UI but any country
 * code is accepted.
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()\-.]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^\+?[1-9]\d{7,14}$/,
        "Enter a valid phone number with country code",
      ),
  )
  .transform((v) => (v.startsWith("+") ? v : `+${v}`));

export const submitCallRequestSchema = z
  .object({
    fullName: z.string().trim().min(1, "Your name is required").max(200),
    company: z.string().trim().max(200).optional(),
    phone: phoneSchema,
    email: z
      .string()
      .trim()
      .max(320)
      .refine(
        (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
        "Enter a valid email",
      )
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
    requirement: z
      .string()
      .trim()
      .min(10, "Tell us a little about what you need (min 10 characters)")
      .max(2000),
    consent: z
      .boolean()
      .refine((v) => v === true, "Please agree to receive a follow-up call"),
  })
  .strict();

export type SubmitCallRequest = z.infer<typeof submitCallRequestSchema>;
