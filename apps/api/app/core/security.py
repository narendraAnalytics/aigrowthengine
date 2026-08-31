"""Auth boundary for the API.

STUB — no endpoint is protected yet. Phase 3/4 wires Clerk JWT verification here:
verify RS256 against the cached Clerk JWKS, check `iss` / `aud` / `exp` / `nbf` /
`azp`, and expose FastAPI dependencies:

    require_user()        -> the authenticated Clerk user id
    require_org_member()  -> (user_id, organization_id) for tenant-scoped routes

Tenant isolation is enforced in the repository layer, not here (see
../roadmap.txt Cross-Cutting Track 1).
"""

from __future__ import annotations

__all__: list[str] = []
