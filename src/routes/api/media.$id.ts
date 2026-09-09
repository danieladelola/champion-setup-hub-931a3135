import { createFileRoute } from "@tanstack/react-router";

import { getDb } from "@/lib/db.server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!UUID.test(params.id)) return new Response("Not found", { status: 404 });
        const sql = getDb();
        const rows = await sql<{ content_type: string; data: Uint8Array }[]>`
          select content_type, data from media where id = ${params.id} limit 1`;
        const row = rows[0];
        if (!row) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(row.data), {
          headers: {
            "content-type": row.content_type,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
