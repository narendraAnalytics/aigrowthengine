# Runbook — Neon database restore

**Project:** `aigrowthengine` (`floral-mode-04102821`, AWS `us-east-2`, Postgres 18)
**Org:** `org-crimson-surf-10534095`
**Branches:** `production` (default, primary) · `staging`

## Backup posture

| Mechanism | Coverage | Notes |
|---|---|---|
| **Point-in-time restore (PITR)** | last **6 hours** | Neon **free plan** cap (`history_retention_seconds = 21600`, already at max). A paid plan raises this to 7–30 days and adds scheduled snapshots. |
| **Manual snapshots** | on demand | `create_snapshot` before any risky migration or bulk change. |
| **`pg_dump` exports** | as often as you run them | The real off-Neon backup. Run before every production migration; keep the last few. |

> There is **no automated off-Neon backup yet.** Until the plan is upgraded, the
> discipline is: `pg_dump` before each production migration (CI will enforce this
> in Phase 1.8 / Track 4).

## Take a manual dump

```bash
# DATABASE_URL = the production pooler string from the Neon dashboard
pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc -f "aigrowthengine-$(date +%Y%m%dT%H%M%SZ).dump"
```

## Restore paths

### A. Recover recent data loss — PITR (within 6h)

1. Neon console → project → **Branches** → **Create branch** → *Point in time* →
   pick a timestamp *before* the bad change. (Or MCP: `restore_snapshot` /
   branch-from-timestamp.)
2. Verify the data on the new branch.
3. Repoint the app: swap `DATABASE_URL` (Vercel + `apps/api`) to the new branch's
   pooler string, redeploy. Promote the branch to primary once confirmed, or
   copy the good rows back into `production`.

### B. Restore from a `pg_dump` file

```bash
# Restore into a fresh branch first — never straight into production.
createdb via Neon console (new branch), then:
pg_restore --no-owner --no-privileges --clean --if-exists \
  -d "<new-branch-DATABASE_URL>" aigrowthengine-<ts>.dump
```

Validate, then repoint the app as in path A step 3.

### C. Roll back one migration

- **Drizzle** (current owner of the schema): Drizzle has no down-migrations.
  Write a forward migration that reverses the change, or use path A.
- **Alembic** (`apps/api`, no migrations yet): `uv run alembic downgrade -1`
  once real migrations exist.

## Restore drill — do this once, then quarterly

1. `pg_dump` production → file.
2. `restore_snapshot` or `pg_restore` into a throwaway branch.
3. Run `apps/api` `/readyz` and a couple of representative queries against it.
4. Delete the throwaway branch. Record the date + wall-clock time here:

| Date | Restored by | Method | Time to green | Notes |
|---|---|---|---|---|
| _(pending — run the first drill)_ | | | | |

## Related

- Schema ownership (Alembic vs Drizzle) — ADR in `docs/adr/`, Phase 3.
- Deploy / migration ordering — roadmap Cross-Cutting Track 4.
