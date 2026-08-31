import "server-only";

import {
  auditEventDef,
  auditEventSchema,
  type AuditEvent,
} from "@/lib/security";
import { db, schema } from "@/server/db";

/**
 * The append-only audit write path (CLAUDE.md #8). The catalogue and shape live
 * in `@/lib/security/audit` (pure); this is the only place a row is inserted.
 *
 * Never let an audit failure break the caller's request — a missed audit row is
 * logged and swallowed. `category` is derived from the event definition so it
 * always agrees with the catalogue.
 */
export async function recordAuditEvent(
  event: Omit<AuditEvent, "at"> & { at?: Date },
): Promise<void> {
  try {
    const parsed = auditEventSchema.parse({ at: new Date(), ...event });
    const def = auditEventDef(parsed.type);
    if (!def) throw new Error(`unknown audit event type: ${parsed.type}`);

    await db.insert(schema.auditEvents).values({
      type: parsed.type,
      category: def.category,
      actorId: parsed.actorId,
      actorRole: parsed.actorRole,
      tenant: parsed.tenant,
      resourceType: parsed.resourceType,
      resourceId: parsed.resourceId,
      requestId: parsed.requestId,
      metadata: parsed.metadata,
      createdAt: parsed.at,
    });
  } catch (err) {
    console.error("[recordAuditEvent] failed:", err);
  }
}
