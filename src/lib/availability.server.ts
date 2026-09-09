import { getDb } from "./db.server";
import { getSettingsSafe } from "./settings.server";
import { closedWeekdays, isOpenOnDate } from "./settings";
import {
  buildTimeSlots,
  DEFAULT_DURATION_MINUTES,
  isDayFullyBooked,
  timeToMinutes,
  unavailableSlots,
  type BusyRange,
} from "./availability";

/** Bookings in these states no longer hold their slot. */
const RELEASED_STATUSES = ["cancelled", "canceled", "declined", "no_show", "expired"];

function toBusyRanges(rows: readonly Record<string, unknown>[]): BusyRange[] {
  const ranges: BusyRange[] = [];
  for (const row of rows) {
    const start = timeToMinutes(row["preferred_time"] as string | null);
    if (start === null) continue;
    const duration = Number(row["duration_minutes"] ?? DEFAULT_DURATION_MINUTES);
    const length = Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DURATION_MINUTES;
    ranges.push({ start, end: start + length });
  }
  return ranges;
}

/** Taken time ranges for one date (YYYY-MM-DD). */
export async function getBusyRangesForDate(date: string): Promise<BusyRange[]> {
  const sql = getDb();
  const rows = await sql`
    select preferred_time, duration_minutes
    from bookings
    where preferred_date = ${date}::date
      and preferred_time is not null
      and coalesce(status, '') <> all(${RELEASED_STATUSES})`;
  return toBusyRanges(rows as unknown as Record<string, unknown>[]);
}

/** Bookable slots for the admin-configured opening hours. */
export async function getConfiguredSlots(): Promise<string[]> {
  const settings = await getSettingsSafe();
  return buildTimeSlots({
    open: settings.booking.open_time,
    close: settings.booking.close_time,
    interval: settings.booking.slot_interval_minutes,
  });
}

/** Weekday indexes (0 = Sunday) the salon is closed on, from admin Settings. */
export async function getClosedWeekdays(): Promise<number[]> {
  const settings = await getSettingsSafe();
  return closedWeekdays(settings.booking.open_days);
}

/** True when the salon takes bookings on that date's weekday. */
export async function isOpenDay(date: string) {
  const settings = await getSettingsSafe();
  return isOpenOnDate(settings.booking.open_days, date);
}

/**
 * True when the date can be booked at all: an open weekday that the admin has
 * not blocked. A blocked date always wins over the normal opening days.
 */
export async function isBookableDate(date: string) {
  if (!(await isOpenDay(date))) return false;
  return !(await isDateBlocked(date));
}

export async function getDayAvailability(date: string, durationMinutes?: number) {
  const [busy, slots, settings, block] = await Promise.all([
    getBusyRangesForDate(date),
    getConfiguredSlots(),
    getSettingsSafe(),
    getBlockForDate(date).catch(() => null),
  ]);
  const openWeekday = isOpenOnDate(settings.booking.open_days, date);
  const open = openWeekday && !block;
  return {
    date,
    busy,
    slots,
    closed: !open,
    blocked: Boolean(block),
    block_reason: block?.reason ?? null,
    unavailable_message: block ? UNAVAILABLE_MESSAGE : null,
    closed_weekdays: closedWeekdays(settings.booking.open_days),
    // A closed weekday or a blocked date has nothing bookable at all.
    unavailable: open ? unavailableSlots(busy, durationMinutes, slots) : slots,
  };
}

/** Dates in the given month (YYYY-MM) where nothing is left to book. */
export async function getFullyBookedDates(month: string, durationMinutes?: number) {
  const sql = getDb();
  const rows = await sql`
    select to_char(preferred_date, 'YYYY-MM-DD') as day, preferred_time, duration_minutes
    from bookings
    where preferred_date is not null
      and preferred_time is not null
      and to_char(preferred_date, 'YYYY-MM') = ${month}
      and coalesce(status, '') <> all(${RELEASED_STATUSES})`;

  const byDay = new Map<string, Record<string, unknown>[]>();
  for (const row of rows as unknown as Record<string, unknown>[]) {
    const day = row["day"] as string;
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }

  const slots = await getConfiguredSlots();
  const full: string[] = [];
  for (const [day, list] of byDay) {
    if (isDayFullyBooked(toBusyRanges(list), durationMinutes, slots)) full.push(day);
  }
  return full.sort();
}

/** Returns true when the requested slot is still free. */
export async function isSlotAvailable(date: string, time: string, durationMinutes?: number) {
  const start = timeToMinutes(time);
  if (start === null) return false;
  if (!(await isOpenDay(date))) return false;
  const length =
    durationMinutes && durationMinutes > 0 ? durationMinutes : DEFAULT_DURATION_MINUTES;
  const busy = await getBusyRangesForDate(date);
  return !busy.some((range) => start < range.end && start + length > range.start);
}
