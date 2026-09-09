/**
 * Client-safe types and helpers for admin-managed blocked (unavailable) dates.
 * A blocked date is a single day or an inclusive range that overrides the
 * normal weekly opening hours: nothing can be booked on those days.
 */

export const BLOCK_REASONS = [
  "Public Holiday",
  "Annual Break",
  "Staff Training",
  "Maintenance",
  "Fully Booked",
  "Private Event",
  "Other",
] as const;

export type BlockReason = (typeof BLOCK_REASONS)[number];

export type BlockedDate = {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD (inclusive; equals start_date for one day)
  reason: string;
  note: string | null;
  created_at?: string;
};

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value);
}

/** Every day in an inclusive range, as YYYY-MM-DD strings. */
export function expandRange(start: string, end: string, limit = 800): string[] {
  const out: string[] = [];
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return out;
  const cursor = new Date(from);
  while (cursor <= to && out.length < limit) {
    out.push(toIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function isBlocked(blocks: readonly BlockedDate[], date: string) {
  return blocks.some((b) => date >= b.start_date && date <= b.end_date);
}

export function blockFor(blocks: readonly BlockedDate[], date: string) {
  return blocks.find((b) => date >= b.start_date && date <= b.end_date) ?? null;
}

export function formatRange(block: BlockedDate) {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return block.start_date === block.end_date
    ? fmt(block.start_date)
    : `${fmt(block.start_date)} → ${fmt(block.end_date)}`;
}

export const UNAVAILABLE_MESSAGE =
  "This date is unavailable for booking. Please select another date.";
