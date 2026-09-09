import { getDb } from "./db.server";
import { isOpenDay, isSlotAvailable } from "./availability.server";
import { getBlockForDate } from "./blocked-dates.server";
import { UNAVAILABLE_MESSAGE } from "./blocked-dates";
import { isPastUkSlot } from "./uk-time";
import { timeToMinutes } from "./availability";
import type { bookingSchema, multiBookingSchema } from "./services.server";
import type { z } from "zod";

export type BookingInput = z.infer<typeof bookingSchema>;
export type MultiBookingInput = z.infer<typeof multiBookingSchema>;

export type PricedItem = {
  service_id: string;
  category_id: string | null;
  service_name: string;
  category_name: string | null;
  unit_price: number;
  quantity: number;
  duration_minutes: number;
  line_total: number;
};

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function bookingReference() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MBB-${stamp}-${rand}`;
}

/** Human summary stored on the booking row, e.g. "Lashes + 2 more". */
function summarise(items: PricedItem[]) {
  const first = items[0]?.service_name ?? "Service";
  return items.length > 1 ? `${first} + ${items.length - 1} more` : first;
}

/**
 * Looks each selected service up in PostgreSQL and prices the booking there.
 * Prices and durations never come from the browser.
 */
async function priceItems(
  selection: ReadonlyArray<{ service_id: string; quantity: number }>,
): Promise<PricedItem[]> {
  const sql = getDb();
  const ids = [...new Set(selection.map((s) => s.service_id))];
  const rows = await sql`
    select s.id, s.name, s.price, s.duration_minutes, s.category_id, c.name as category_name
    from services s
    join service_categories c on c.id = s.category_id
    where s.id = any(${ids}::uuid[]) and s.active = true and c.active = true`;

  const byId = new Map(rows.map((r) => [r["id"] as string, r]));
  const items: PricedItem[] = [];
  for (const picked of selection) {
    const service = byId.get(picked.service_id);
    if (!service) throw new BookingError("One of those services is no longer available.", 400);
    const quantity = Math.max(1, Math.floor(picked.quantity || 1));
    const unit = Number(service["price"] ?? 0);
    const duration = Number(service["duration_minutes"] ?? 0) || 60;
    items.push({
      service_id: service["id"] as string,
      category_id: (service["category_id"] as string) ?? null,
      service_name: service["name"] as string,
      category_name: (service["category_name"] as string) ?? null,
      unit_price: unit,
      quantity,
      duration_minutes: duration,
      line_total: Number((unit * quantity).toFixed(2)),
    });
  }
  if (items.length === 0) throw new BookingError("Please choose at least one service.", 400);
  return items;
}

/**
 * Creates one booking in `pending` / `unpaid` state holding every selected
 * service, so the customer pays for all of them with a single payment.
 */
export async function createPendingBooking(input: MultiBookingInput) {
  const sql = getDb();
  const items = await priceItems(input.items);

  const total = Number(items.reduce((s, i) => s + i.line_total, 0).toFixed(2));
  const totalDuration = items.reduce((s, i) => s + i.duration_minutes * i.quantity, 0);

  // A blocked date (holiday, break, private event) overrides opening hours.
  const block = await getBlockForDate(input.preferred_date).catch(() => null);
  if (block) {
    throw new BookingError(UNAVAILABLE_MESSAGE, 400);
  }

  // The salon can switch weekdays off in admin Settings.
  if (!(await isOpenDay(input.preferred_date))) {
    throw new BookingError("We are closed on that day. Please choose another date.", 400);
  }

  // Everything runs on UK time (Europe/London), so British Summer Time is
  // handled automatically. A time that has already gone cannot be booked.
  const startMinutes = timeToMinutes(input.preferred_time) ?? 0;
  if (isPastUkSlot(input.preferred_date, startMinutes)) {
    throw new BookingError(
      "That time has already passed. Please choose a later time.",
      400,
    );
  }

  // Guard against two people paying for the same slot (the browser greys taken
  // slots out, but the check has to live here too). Several services in one
  // visit take the combined time.
  const free = await isSlotAvailable(input.preferred_date, input.preferred_time, totalDuration);
  if (!free) {
    throw new BookingError(
      "That time is not long enough for everything you picked, or it has just been booked. Please choose another time.",
      409,
    );
  }

  const summary = summarise(items);
  const primary = items[0]!;

  let created: Record<string, unknown> | undefined;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const reference = bookingReference();
    const inserted = await sql`
      insert into bookings (booking_reference, full_name, email, phone, customer_name,
        customer_email, service, service_id, category_id, category_name, price,
        duration_minutes, preferred_date, preferred_time, notes, status, payment_status)
      values (${reference}, ${input.full_name}, ${input.email}, ${input.phone ?? null},
        ${input.full_name}, ${input.email}, ${summary},
        ${primary.service_id}, ${primary.category_id}, ${primary.category_name},
        ${total}, ${totalDuration}, ${input.preferred_date},
        ${input.preferred_time}, ${input.notes ?? null}, 'pending', 'unpaid')
      on conflict (booking_reference) do nothing
      returning *`;
    created = inserted[0];
  }
  if (!created) throw new BookingError("Could not create the booking. Please try again.", 500);

  const bookingId = created["id"] as string;
  for (const item of items) {
    await sql`
      insert into booking_items (booking_id, service_id, category_id, service_name,
        category_name, unit_price, quantity, duration_minutes, line_total, status, payment_status)
      values (${bookingId}, ${item.service_id}, ${item.category_id}, ${item.service_name},
        ${item.category_name}, ${item.unit_price}, ${item.quantity}, ${item.duration_minutes},
        ${item.line_total}, 'pending', 'unpaid')`;
  }

  return { booking: created, price: total, serviceName: summary, items };
}

export async function attachBookingSession(bookingId: string, sessionId: string) {
  const sql = getDb();
  await sql`
    update bookings
    set payment_provider = 'stripe', stripe_session_id = ${sessionId}, updated_at = now()
    where id = ${bookingId}`;
}

/**
 * Idempotently confirms a booking once Stripe reports the payment succeeded.
 * Every service inside the booking is marked paid together.
 */
export async function markBookingPaid(params: {
  sessionId: string;
  paymentIntentId: string | null;
  paymentMethod: string | null;
  reference?: string | null;
}) {
  const sql = getDb();
  const rows = await sql`
    update bookings
    set payment_status = 'paid',
        status = case when status = 'pending' then 'confirmed' else status end,
        payment_provider = 'stripe',
        payment_method = coalesce(${params.paymentMethod}, payment_method),
        stripe_session_id = coalesce(stripe_session_id, ${params.sessionId}),
        stripe_payment_intent_id = coalesce(${params.paymentIntentId}, stripe_payment_intent_id),
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
    where (stripe_session_id = ${params.sessionId}
           or booking_reference = ${params.reference ?? null})
      and payment_status <> 'paid'
    returning id, booking_reference, status, payment_status`;

  const booking = rows[0];
  if (booking) {
    await sql`
      update booking_items
      set payment_status = 'paid',
          status = case when status = 'pending' then 'confirmed' else status end
      where booking_id = ${booking["id"] as string}`;
  }
  return booking ?? null;
}

/** Cancels a booking whose Stripe session expired or failed without payment. */
export async function expireBooking(sessionId: string) {
  const sql = getDb();
  // The appointment itself is kept — only the payment is marked as failed, so
  // the salon still sees it under Pending Payment and can take money in person.
  const rows = await sql`
    update bookings
    set payment_status = 'failed', updated_at = now()
    where stripe_session_id = ${sessionId} and payment_status <> 'paid'
    returning id`;
  const booking = rows[0];
  if (booking) {
    await sql`
      update booking_items set payment_status = 'failed'
      where booking_id = ${booking["id"] as string}`;
  }
}


export async function getBookingItems(bookingId: string) {
  const sql = getDb();
  const rows = await sql`
    select id, service_id, service_name, category_name, unit_price, quantity,
           duration_minutes, line_total, status, payment_status
    from booking_items where booking_id = ${bookingId} order by created_at asc`;
  return rows as unknown as Record<string, unknown>[];
}

export async function getBookingByReference(reference: string) {
  const sql = getDb();
  const rows = await sql`
    select id, booking_reference, full_name, email, phone, service, category_name,
           price, duration_minutes, preferred_date, preferred_time, notes,
           status, payment_status, payment_method, stripe_payment_intent_id, created_at
    from bookings where booking_reference = ${reference} limit 1`;
  const booking = rows[0];
  if (!booking) return null;
  const items = await getBookingItems(booking["id"] as string);
  return { ...booking, items };
}
