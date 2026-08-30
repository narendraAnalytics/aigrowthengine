# AI Growth Engine

> **Turn Business Challenges Into Growth Opportunities.**

AI Growth Engine is an AI-powered business-growth platform. A business describes a
real operational problem in plain language; the platform runs an AI assessment,
matches it to a capability the company can **actually deliver**, produces an
**explainable lead score**, and converts it into a qualified opportunity that
moves through consultation → proposal → pilot → implementation → scale.

It also provides an **Investor Room** with graded, revocable, fully audited access
to company materials.

**The platform is the acquisition engine for a services business.** Its job is to
make delivering AI/automation projects repeatable, and to compound: every project
becomes a case study that makes the next match better.

```text
Business Problem
   ↓  AI analysis (Gemini → signals only)
Capability Match      ← only from capabilities we can actually deliver
   ↓
Explainable Lead Score  ← deterministic, computed by the backend ("Why 91?")
   ↓
Qualified Opportunity → Consultation → Proposal → Pilot → Project → Case Study
                                                                        ↺
```

## Status

Early foundation. As of 2026-08-30 the repo contains a bare Next.js 16 frontend
scaffold with the production stack installed but not yet wired. See
[`roadmap.txt`](./roadmap.txt) for the full engineering checklist and current
progress, and [`FinalRoadMap.txt`](./FinalRoadMap.txt) for product strategy.

## Tech stack

- **Frontend** — Next.js 16 (App Router, Turbopack, React 19.2), TypeScript,
  Tailwind v4, shadcn/ui, Serwist PWA
- **Auth** — Clerk (users + organizations, multi-tenant)
- **Backend** — FastAPI, Python 3.12, SQLAlchemy 2.0 async, Alembic
- **Database** — Neon PostgreSQL + pgvector
- **AI** — Google Gemini (structured output)
- **Files** — Cloudflare R2
- **Observability / Analytics** — Sentry, PostHog
- **Deploy** — Vercel (web) + Cloud Run / Render (api) + Neon

## Repository layout

```text
aigrowthengine/
├── apps/
│   ├── web/        Next.js 16 PWA   (currently ./frontend)
│   └── api/        FastAPI service  (to be scaffolded)
├── packages/       shared types + config
├── infra/          Dockerfiles, IaC, deploy manifests
├── docs/           PRD, ERD, API contract, security model, analytics, ADRs
├── .github/        CI/CD
├── FinalRoadMap.txt   product & strategy
├── roadmap.txt        engineering execution checklist
└── overview.txt       external roadmap review
```

## Getting started

> Restructuring into `apps/` is the first roadmap task. Until then, the app lives
> in `./frontend`.

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in Clerk / PostHog / API keys
npm run dev                    # http://localhost:3000
```

## Core principles

1. **Gemini emits signals only** — the backend computes every score deterministically.
2. **The AI only recommends capabilities that exist** — no confident match means we
   say so and offer an expert review, we never invent a solution.
3. **Tenant isolation everywhere** — Client A can never see Client B's data.
4. **Security is built through every phase**, not bolted on at the end.
5. **The AI holds no business authority** — humans approve everything outbound.
6. **Validate the funnel before scaling the platform.**

## Documentation

| File | Purpose |
|---|---|
| [`FinalRoadMap.txt`](./FinalRoadMap.txt) | Product vision, engines, phases, KPIs |
| [`roadmap.txt`](./roadmap.txt) | Engineering execution checklist (tick boxes) |
| [`overview.txt`](./overview.txt) | External review of the roadmap |
| [`CLAUDE.md`](./CLAUDE.md) | Working guidance for contributors & AI assistants |
| `docs/` | Specs frozen in Phase 0 (PRD, ERD, API contract, security, analytics) |
