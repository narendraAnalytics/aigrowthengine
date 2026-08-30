import { z } from "zod";

/**
 * Standard error envelope for every v1 API response (Phase 0.4).
 *
 *   { "error": { "code": "...", "message": "...", "details": [...], "request_id": "..." } }
 *
 * `code` is a stable machine string (clients switch on it); `message` is human
 * text that may change; `details` carries field-level validation errors; every
 * error echoes the `request_id` for support/tracing.
 */

export const API_ERROR_CODES = [
  "validation_error", // 400 — request failed schema validation
  "unauthorized", // 401 — no / invalid session
  "forbidden", // 403 — authenticated but not allowed (tenant / role)
  "not_found", // 404
  "conflict", // 409 — e.g. idempotency key reused with a different body
  "rate_limited", // 429
  "assessment_failed", // 422 — the AI pipeline could not produce a result
  "internal_error", // 500
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const HTTP_STATUS_FOR_CODE: Record<ApiErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  assessment_failed: 422,
  internal_error: 500,
};

export const apiErrorDetailSchema = z.object({
  /** Dot-path of the offending field, when applicable (e.g. "answers.industry"). */
  field: z.string().optional(),
  message: z.string(),
});
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    details: z.array(apiErrorDetailSchema).default([]),
    request_id: z.string(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export function buildApiErrorBody(
  code: ApiErrorCode,
  message: string,
  opts: { details?: ApiErrorDetail[]; requestId: string },
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      details: opts.details ?? [],
      request_id: opts.requestId,
    },
  };
}

/** Build a JSON `Response` with the right status for `code`. */
export function apiError(
  code: ApiErrorCode,
  message: string,
  opts: { details?: ApiErrorDetail[]; requestId: string },
): Response {
  return Response.json(buildApiErrorBody(code, message, opts), {
    status: HTTP_STATUS_FOR_CODE[code],
    headers: { "x-request-id": opts.requestId },
  });
}

/** Map a ZodError into `validation_error` details. */
export function zodErrorToDetails(error: z.ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}
