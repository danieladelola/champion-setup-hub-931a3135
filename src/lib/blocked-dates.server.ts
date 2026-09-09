/**
 * Persistence for admin-managed blocked dates. Blocked dates override the
 * normal opening days: no slots are offered and the booking API refuses them.
 */
import { getDb } from "./db.server";
import { expandRange, type BlockedDate } from "./blocked-dates";

const RELEASED_STATUSES = ["cancelled", "canceled", "declined", "no_show", "expired"];

let ensured: Promise<void> | null = null;

export async function ensureBlockedDatesTable() {
  if (!ensured) {
    ensured = (async () => {
      const sql = getDb();
      await sql`
        create table if not exists blocked_dates (
          id uuid primary key default gen_random_uuid(),
          start_date date not null,
          end_date date not null,
          reason text not null default 'Other',
          note text,
          created_at timestamptz not null default now(),
          constraint blocked_dates_range check (end_date >= start_date)
        )`;
      await sql`create index if not exists blocked_dates_start_idx on blocked_dates (start_date)`;
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}

function toBlock(row: Record<string, unknown>): BlockedDate {
  return {
    id: String(row["id"]),
    start_date: String(row["start_date"]),
    end_date: String(row["end_date"]),
    reason: String(row["reason"] ?? "Other"),
    note: (row["note"] as string | null) ?? null,
    ...(row["created_at"] ? { created_at: String(row["created_at"]) } : {}),
  };
}

/** All blocks, newest first by start date. Optionally only current/upcoming. */
export async function listBlockedDates(upcomingOnly = false): Promise<BlockedDate[]> {
  await ensureBlockedDatesTable();
  const sql = getDb();
  const rows = upcomingOnly
    ? await sql`
        select id, to_char(start_date,'YYYY-MM-DD') as start_date,
               to_char(end_date,'YYYY-MM-DD') as end_date, reason, note, created_at
        from blocked_dates where end_date >= current_date order by start_date asc`
    : await sql`
        select id, to_char(start_date,'YYYY-MM-DD') as start_date,
               to_char(end_date,'YYYY-MM-DD') as end_date, reason, note, created_at
        from blocked_dates order by start_date asc`;
  return (rows as unknown as Record<string, unknown>[]).map(toBlock);
}

/** Blocks that touch a given month (YYYY-MM). */
export async function getBlockedDatesForMonth(month: string): Promise<BlockedDate[]> {
  await ensureBlockedDatesTable();
  const sql = getDb();
  const first = `${month}-01`;
  const rows = await sql`
    select id, to_char(start_date,'YYYY-MM-DD') as start_date,
           to_char(end_date,'YYYY-MM-DD') as end_date, reason, note
    from blocked_dates
    where start_date <= (date ${first} + interval '1 month' - interval '1 day')
      and end_date >= date ${first}
    order by start_date asc`;
  return (rows as unknown as Record<string, unknown>[]).map(toBlock);
}

/** Individual blocked days inside a month, for the booking calendar. */
export async function getBlockedDaysInMonth(month: string): Promise<string[]> {
  const blocks = await getBlockedDatesForMonth(month);
  const days = new Set<string>();
  for (const block of blocks) {
    for (const day of expandRange(block.start_date, block.end_date)) {
      if (day.startsWith(month)) days.add(day);
    }
  }
  return [...days].sort();
}

/** The block covering a date, or null. */
export async function getBlockForDate(date: string): Promise<BlockedDate | null> {
  await ensureBlockedDatesTable();
  const sql = getDb();
  const rows = await sql`
    select id, to_char(start_date,'YYYY-MM-DD') as start_date,
           to_char(end_date,'YYYY-MM-DD') as end_date, reason, note
    from blocked_dates
    where start_date <= ${date}::date and end_date >= ${date}::date
    limit 1`;
  const row = (rows as unknown as Record<string, unknown>[])[0];
  return row ? toBlock(row) : null;
}

export async function isDateBlocked(date: string) {
  return (await getBlockForDate(date)) !== null;
}

/** How many live bookings already sit inside a range (never auto-deleted). */
export async function countBookingsInRange(start: string, end: string) {
  const sql = getDb();
  const rows = await sql`
    select count(*)::int as count
    from bookings
    where preferred_date between ${start}::date and ${end}::date
      and coalesce(status, '') <> all(${RELEASED_STATUSES})`;
  return Number((rows as unknown as Record<string, unknown>[])[0]?.["count"] ?? 0);
}

export async function createBlockedDate(input: {
  start_date: string;
  end_date: string;
  reason: string;
  note?: string | null;
}): Promise<BlockedDate> {
  await ensureBlockedDatesTable();
  const sql = getDb();
  const rows = await sql`
    insert into blocked_dates (start_date, end_date, reason, note)
    values (${input.start_date}::date, ${input.end_date}::date, ${input.reason}, ${input.note ?? null})
    returning id, to_char(start_date,'YYYY-MM-DD') as start_date,
              to_char(end_date,'YYYY-MM-DD') as end_date, reason, note, created_at`;
  return toBlock((rows as unknown as Record<string, unknown>[])[0]!);
}

export async function updateBlockedDate(
  id: string,
  input: { start_date: string; end_date: string; reason: string; note?: string | null },
): Promise<BlockedDate | null> {
  await ensureBlockedDatesTable();
  const sql = getDb();
  const rows = await sql`
    update blocked_dates
    set start_date = ${input.start_date}::date,
        end_date = ${input.end_date}::date,
        reason = ${input.reason},
        note = ${input.note ?? null}
    where id = ${id}::uuid
    returning id, to_char(start_date,'YYYY-MM-DD') as start_date,
              to_char(end_date,'YYYY-MM-DD') as end_date, reason, note, created_at`;
  const row = (rows as unknown as Record<string, unknown>[])[0];
  return row ? toBlock(row) : null;
}

export async function deleteBlockedDate(id: string) {
  await ensureBlockedDatesTable();
  const sql = getDb();
  await sql`delete from blocked_dates where id = ${id}::uuid`;
  return true;
}
