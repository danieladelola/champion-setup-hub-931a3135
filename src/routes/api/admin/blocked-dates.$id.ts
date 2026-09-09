import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { deleteBlockedDate, updateBlockedDate } from "@/lib/blocked-dates.server";
import { BLOCK_REASONS, isValidDate } from "@/lib/blocked-dates";

export const Route = createFileRoute("/api/admin/blocked-dates/$id")({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const b = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
          const start = b["start_date"];
          const end = b["end_date"] ?? start;
          if (!isValidDate(start) || !isValidDate(end)) {
            return json({ error: "Pick a valid date" }, { status: 400 });
          }
          if (end < start) {
            return json({ error: "The end date must be after the start date" }, { status: 400 });
          }
          const reasonRaw = typeof b["reason"] === "string" ? b["reason"].trim() : "Other";
          const reason = (BLOCK_REASONS as readonly string[]).includes(reasonRaw)
            ? reasonRaw
            : "Other";
          const note = typeof b["note"] === "string" ? b["note"].trim().slice(0, 300) : "";
          const blocked_date = await updateBlockedDate(params["id"] as string, {
            start_date: start,
            end_date: end,
            reason,
            note: note || null,
          });
          if (!blocked_date) return json({ error: "Not found" }, { status: 404 });
          return json({ blocked_date });
        } catch (error) {
          console.error("PUT /api/admin/blocked-dates/:id failed", error);
          return json({ error: "Could not update the blocked date" }, { status: 500 });
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          await deleteBlockedDate(params["id"] as string);
          return json({ ok: true });
        } catch (error) {
          console.error("DELETE /api/admin/blocked-dates/:id failed", error);
          return json({ error: "Could not remove the blocked date" }, { status: 500 });
        }
      },
    },
  },
});
