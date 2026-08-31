import * as Sentry from "@sentry/nextjs";

import { commonSentryOptions } from "@/sentry.shared";

export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    Sentry.init(commonSentryOptions);
  }
}

// Reports errors thrown inside Server Components / route handlers / the RSC
// render to Sentry (Next 16 hook).
export const onRequestError = Sentry.captureRequestError;
