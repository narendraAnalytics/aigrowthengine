import * as Sentry from "@sentry/nextjs";

import { commonSentryOptions } from "@/sentry.shared";

Sentry.init(commonSentryOptions);

// Feeds App Router navigations into Sentry tracing (Next 16 hook).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
