import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import {
  countBookingsInRange,
  createBlockedDate,
  listBlockedDates,
} from "@/lib/blocked-dates.server";
import { BLOCK_REASONS, isValidDate } from "@/lib/blocked-dates";

function parseBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const start = b["start_date"];
  const end = b["end_date"] ?? start;
  if (!isValidDate(start) || !isValidDate(end)) return { error: "Pick a valid date" as const };
  if (end < start) return { error: "The end date must be after the start date" as const };
  const reasonRaw = typeof b["reason"] === "string" ? b["reason"].trim() : "Other";
  const reason = (BLOCK_REASONS as readonly string[]).includes(reasonRaw) ? reasonRaw : "Other";
  const note = typeof b["note"] === "string" ? b["note"].trim().slice(0, 300) : "";
  return { value: { start_date: start, end_date: end, reason, note: note || null } };
}

export const Route = createFileRoute("/api/admin/blocked-dates")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const url = new URL(request.url);
          const start = url.searchParams.get("check_start");
          const end = url.searchParams.get("check_end") ?? start;
          // Used by the admin form to warn about bookings already on those days.
          if (isValidDate(start) && isValidDate(end)) {
            return json({ affected_bookings: await countBookingsInRange(start, end) });
          }
          const upcomingOnly = url.searchParams.get("upcoming") === "1";
          return json({ blocked_dates: await listBlockedDates(upcomingOnly) });
        } catch (error) {
          console.error("GET /api/admin/blocked-dates failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
      POST: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const parsed = parseBody(await request.json().catch(() => null));
          if (!parsed.value) return json({ error: parsed.error }, { status: 400 });
          const blocked_date = await createBlockedDate(parsed.value);
          const affected = await countBookingsInRange(
            parsed.value.start_date,
            parsed.value.end_date,
          );
          return json({ blocked_date, affected_bookings: affected });
        } catch (error) {
          console.error("POST /api/admin/blocked-dates failed", error);
          return json({ error: "Could not save the blocked date" }, { status: 500 });
        }
      },
    },
  },
});
