import { createServerFn } from "@tanstack/react-start";

import { DEFAULT_SETTINGS, type SiteSettings } from "./settings";

/**
 * Loads site settings on the server so the root route can render the correct
 * branding, SEO defaults and toggles during SSR (no client flash).
 */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    try {
      const { getSettingsSafe } = await import("./settings.server");
      return await getSettingsSafe();
    } catch (error) {
      console.error("getSiteSettings failed, using defaults", error);
      return DEFAULT_SETTINGS;
    }
  },
);
