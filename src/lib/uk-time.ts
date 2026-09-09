/**
 * UK (Europe/London) is the official booking timezone.
 *
 * Everything here derives "now" from the Europe/London zone via Intl, so
 * British Summer Time is handled automatically — no manual offsets anywhere.
 * The same helpers run in the browser and on the server so both agree.
 */

export const BOOKING_TIMEZONE = "Europe/London";

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: BOOKING_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

type UkNow = {
  /** YYYY-MM-DD in UK time. */
  date: string;
  /** Minutes since midnight, UK time. */
  minutes: number;
};

/** The current UK date and time-of-day. */
export function ukNow(at: Date = new Date()): UkNow {
  const parts = partsFormatter.formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + minute,
  };
}

/** Today's date (YYYY-MM-DD) in UK time. */
export function ukToday(at: Date = new Date()) {
  return ukNow(at).date;
}

/** Minutes since midnight right now, UK time. */
export function ukNowMinutes(at: Date = new Date()) {
  return ukNow(at).minutes;
}

/** True when the given YYYY-MM-DD is today in the UK. */
export function isUkToday(date: string, at: Date = new Date()) {
  return date === ukToday(at);
}

/** True when the date is already in the past in the UK. */
export function isPastUkDate(date: string, at: Date = new Date()) {
  return date < ukToday(at);
}

/**
 * True when a slot on the given date has already passed in UK time, taking the
 * salon's minimum notice into account. Past days are always "passed".
 */
export function isPastUkSlot(
  date: string,
  slotMinutes: number,
  minNoticeHours = 0,
  at: Date = new Date(),
) {
  const now = ukNow(at);
  if (date < now.date) return true;
  if (date > now.date) return false;
  const notice = Math.max(0, minNoticeHours) * 60;
  return slotMinutes <= now.minutes + notice;
}
