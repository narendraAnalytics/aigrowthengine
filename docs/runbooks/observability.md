# Runbook — Observability (Sentry + uptime)

## Sentry

Errors + performance for both apps go to **Sentry**. The SDKs are wired but
**inert until a DSN is set** — nothing sends until then.

### One-time setup (dashboard)

1. Create a Sentry org (done — `o4512004057268224`, US region).
2. Create **two projects**:
   - `aigrowthengine-web` — platform **Next.js**
   - `aigrowthengine-api` — platform **Python / FastAPI**
   > A single shared project also works to start; two keeps web vs. API errors separate.
3. For each project: **Settings → Client Keys (DSN)** → copy the `https://…@…ingest…/…` DSN.
4. **Settings → Auth Tokens** → create a token (`sntryu_…`) with
   `project:releases` + `project:write` scope. This is `SENTRY_AUTH_TOKEN` —
   **CI secret only**.
5. Note the **org slug** and each **project slug** (`SENTRY_ORG`, `SENTRY_PROJECT`).

### Where each value goes

| Var | web | api | Set in |
|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | ✓ | | Vercel (all envs), local `.env` |
| `SENTRY_DSN` | | ✓ | API host secret manager, local `.env` |
| `SENTRY_AUTH_TOKEN` | ✓ | ✓ | **CI only** (GitHub Actions secret) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | ✓ | | CI (build) |
| `SENTRY_RELEASE` | auto | ✓ | CI / deploy — the git SHA |

### How it's wired

**Web** (`@sentry/nextjs`):
- `src/instrumentation.ts` — Node/Edge init + `onRequestError`
- `src/instrumentation-client.ts` — browser init + `onRouterTransitionStart`
- `src/app/global-error.tsx` — captures root-layout crashes
- `src/sentry.shared.ts` — shared options: `sendDefaultPii: false`, a
  `beforeSend` that strips cookies / auth headers / user email+ip,
  `tracesSampleRate` 0.1 in prod
- `next.config.ts` → `withSentryConfig` — source maps upload **only when
  `SENTRY_AUTH_TOKEN` is present** (so: CI only). `webpack.treeshake` drops
  debug logging from the client bundle.
- CSP `connect-src` allows `https://*.sentry.io`.

**API** (`sentry-sdk[fastapi]`):
- `app/core/observability.py` `init_sentry()` — called from `main.py`. Same
  scrubbing + `send_default_pii=False`. Starlette + FastAPI + asyncio
  integrations. `traces_sample_rate` from `SENTRY_TRACES_SAMPLE_RATE` (0.1).
- No-op with no DSN; tests force it off via `conftest.py`.

### Verifying it works

- Web: temporarily add a route that throws, load it, confirm the issue in Sentry.
  Or `Sentry.captureMessage("test")` in a server action.
- API: `python -c "import sentry_sdk; sentry_sdk.init('<dsn>'); sentry_sdk.capture_message('test')"`.

### Deferred → Phase 1.8

Source-map upload + release tagging run **in CI** — add `SENTRY_AUTH_TOKEN`,
`SENTRY_ORG`, `SENTRY_PROJECT` as GitHub Actions secrets and pass
`SENTRY_RELEASE=$GITHUB_SHA` to the web build and the API deploy.

## Uptime monitoring (manual — dashboard)

Both apps expose **`/healthz`** (`{"status":"ok"}`, no dependencies).

Set up a monitor (Sentry **Uptime Monitors**, or UptimeRobot / BetterStack):

| Target | URL | Interval |
|---|---|---|
| Web | `https://aigrowthengine.vercel.app/healthz` | 1–5 min |
| API | `https://<api-host>/healthz` | 1–5 min — **after the API is deployed (Track 4)** |

Alert to email / Slack on 2 consecutive failures.
