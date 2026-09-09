/**
 * Persistence for site settings. A single JSON document lives in
 * `site_settings`; it is always read and written through the shared Zod
 * schema so unknown or invalid values can never reach the frontend.
 */
import { getDb } from "./db.server";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  settingsSchema,
  type SiteSettings,
} from "./settings";

let ensured: Promise<void> | null = null;

async function ensureTable() {
  if (!ensured) {
    ensured = (async () => {
      const sql = getDb();
      await sql`
        create table if not exists site_settings (
          id boolean primary key default true,
          data jsonb not null default '{}'::jsonb,
          updated_at timestamptz not null default now(),
          constraint site_settings_single_row check (id)
        )`;
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}

/** Current settings, falling back to defaults when nothing is stored yet. */
export async function getSettings(): Promise<SiteSettings> {
  await ensureTable();
  const sql = getDb();
  const rows = await sql<{ data: unknown }[]>`select data from site_settings where id = true`;
  const stored = rows[0]?.data;
  if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS;
  const parsed = settingsSchema.safeParse(stored);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

/** Never throws: used by public pages that must render even without a database. */
export async function getSettingsSafe(): Promise<SiteSettings> {
  try {
    return await getSettings();
  } catch (error) {
    console.error("getSettings failed, using defaults", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Validates a partial update, merges it over the stored document and saves it.
 * Returns the new, fully-populated settings.
 */
export async function saveSettings(patch: unknown): Promise<SiteSettings> {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("Invalid settings payload");
  }
  const current = await getSettings();
  const merged = mergeSettings(current, patch as Record<string, unknown>);
  const parsed = settingsSchema.safeParse(merged);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.join(" · ");
    throw new Error(where ? `${where}: ${issue?.message}` : (issue?.message ?? "Invalid settings"));
  }
  const sql = getDb();
  await sql`
    insert into site_settings (id, data, updated_at)
    values (true, ${sql.json(parsed.data as never)}, now())
    on conflict (id) do update set data = excluded.data, updated_at = now()`;
  return parsed.data;
}
