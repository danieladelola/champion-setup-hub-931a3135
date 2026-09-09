import { createFileRoute } from "@tanstack/react-router";

import { clearedCookie, destroySession, json } from "@/lib/auth.server";

export const Route = createFileRoute("/api/admin/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await destroySession(request);
        return json({ ok: true }, { headers: { "set-cookie": clearedCookie(request) } });
      },
    },
  },
});
