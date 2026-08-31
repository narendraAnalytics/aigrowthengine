import { z } from "zod";

/**
 * Cursor-based pagination convention for v1 list endpoints (Phase 0.4).
 *
 * Request:  ?cursor=<opaque>&limit=<1..100>
 * Response: { items: T[], next_cursor: string | null }
 *
 * The cursor is opaque base64(JSON) — clients must treat it as a blob and pass it
 * back verbatim. Server decides what goes inside (typically the sort key of the
 * last row). Filtering/sorting params are endpoint-specific and documented per
 * endpoint; the cursor encodes whatever the server needs to resume.
 */

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const cursorPageParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT),
});
export type CursorPageParams = z.infer<typeof cursorPageParamsSchema>;

export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
};

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor<T = Record<string, unknown>>(
  cursor: string | undefined,
): T | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Given `limit + 1` rows fetched, trim to `limit` and derive `next_cursor`.
 * `makeCursor` receives the last visible row.
 */
export function toCursorPage<T>(
  rows: T[],
  limit: number,
  makeCursor: (lastRow: T) => Record<string, unknown>,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const next_cursor =
    hasMore && items.length > 0
      ? encodeCursor(makeCursor(items[items.length - 1]!))
      : null;
  return { items, next_cursor };
}
