import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

export const Route = createFileRoute("/api/admin/messages/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        let body: { read?: boolean };
        try {
          body = (await request.json()) as { read?: boolean };
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const sql = getDb();
        const rows = await sql`
          update messages set read = ${Boolean(body.read)} where id = ${params.id} returning *`;
        if (!rows[0]) return json({ error: "Not found" }, { status: 404 });
        return json({ message: rows[0] });
      },
      DELETE: async ({ request, params }) => {
        const admin = await getAdminFromRequest(request).catch(() => null);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
        const sql = getDb();
        await sql`delete from messages where id = ${params.id}`;
        return json({ ok: true });
      },
    },
  },
});
