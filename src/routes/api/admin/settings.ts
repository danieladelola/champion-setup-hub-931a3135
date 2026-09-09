import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getSettings, saveSettings } from "@/lib/settings.server";

export const Route = createFileRoute("/api/admin/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const admin = await getAdminFromRequest(request);
          if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
          const settings = await getSettings();
          return json({ settings });
        } catch (error) {
          console.error("GET /api/admin/settings failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
      },
      PUT: async ({ request }) => {
        let admin;
        try {
          admin = await getAdminFromRequest(request);
        } catch (error) {
          console.error("PUT /api/admin/settings auth failed", error);
          return json({ error: "Database unavailable" }, { status: 503 });
        }
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }

        try {
          const settings = await saveSettings(body);
          return json({ settings });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not save settings";
          console.error("PUT /api/admin/settings failed", error);
          return json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
