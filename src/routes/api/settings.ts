import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { getSettingsSafe } from "@/lib/settings.server";

export const Route = createFileRoute("/api/settings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const settings = await getSettingsSafe();
          return json(
            { settings },
            { headers: { "cache-control": "public, max-age=30" } },
          );
        } catch (error) {
          console.error("GET /api/settings failed", error);
          return json({ settings: DEFAULT_SETTINGS });
        }
      },
    },
  },
});
