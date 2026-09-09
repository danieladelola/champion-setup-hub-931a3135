import { z } from "zod";

import { getDb } from "./db.server";
import { getSettingsSafe } from "./settings.server";

export const checkoutSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("A valid email is required").max(255),
  phone: z.string().trim().min(6, "A valid phone number is required").max(40),
  address: z.string().trim().min(4, "Address is required").max(400),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().trim().min(1, "State is required").max(120),
  country: z.string().trim().min(1, "Country is required").max(120),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid("Invalid product"),
        quantity: z.coerce.number().int().min(1).max(999),
      }),
    )
    .min(1, "Your cart is empty. Add a product before proceeding to checkout."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

import { calculateDeliveryFee } from "./shipping";

export { calculateDeliveryFee };

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MBP-${stamp}-${rand}`;
}

/**
 * Creates an order inside a single transaction. Prices, subtotal and total are
 * always recalculated from PostgreSQL — never taken from the client.
 */
export async function createOrder(input: CheckoutInput) {
  const sql = getDb();

  // Collapse duplicate product ids
  const wanted = new Map<string, number>();
  for (const item of input.items) {
    wanted.set(item.product_id, (wanted.get(item.product_id) ?? 0) + item.quantity);
  }
  const ids = [...wanted.keys()];

  return await sql.begin(async (tx) => {
    const products = await tx`
      select id, name, sku, price, sale_price, stock_quantity, active
      from products
      where id in ${tx(ids)}
      for update`;

    const rows: Array<{
      product_id: string;
      product_name: string;
      sku: string | null;
      unit_price: number;
      quantity: number;
      line_total: number;
    }> = [];

    for (const id of ids) {
      const p = products.find((r) => r["id"] === id);
      if (!p) throw new OrderError("A product in your cart is no longer available.", 400);
      if (!p["active"]) throw new OrderError(`${p["name"]} is no longer available.`, 400);
      const quantity = wanted.get(id)!;
      if (p["stock_quantity"] < quantity) {
        throw new OrderError(
          `Only ${p["stock_quantity"]} items are currently available.`,
          400,
        );
      }
      const unit = Number(p["sale_price"] ?? p["price"]);
      rows.push({
        product_id: p["id"],
        product_name: p["name"],
        sku: p["sku"],
        unit_price: unit,
        quantity,
        line_total: Number((unit * quantity).toFixed(2)),
      });
    }

    const subtotal = Number(rows.reduce((s, r) => s + r.line_total, 0).toFixed(2));
    const shopSettings = (await getSettingsSafe()).shop;
    const deliveryFee = calculateDeliveryFee(subtotal, {
      flatRate: shopSettings.shipping_flat_rate,
      freeThreshold: shopSettings.free_shipping_threshold,
    });
    const total = Number((subtotal + deliveryFee).toFixed(2));

    const customerName = `${input.first_name} ${input.last_name}`.trim();

    let created: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const number = orderNumber();
      const inserted = await tx`
        insert into orders (order_number, customer_name, customer_email, first_name, last_name,
          email, phone, address, city, state, country, notes, subtotal, delivery_fee, total,
          status, payment_status)
        values (${number}, ${customerName}, ${input.email}, ${input.first_name}, ${input.last_name},
          ${input.email}, ${input.phone}, ${input.address}, ${input.city}, ${input.state},
          ${input.country}, ${input.notes ?? null}, ${subtotal}, ${deliveryFee}, ${total},
          'pending', 'unpaid')
        on conflict (order_number) do nothing
        returning *`;
      created = inserted[0];
    }
    if (!created) throw new OrderError("Could not create the order. Please try again.", 500);

    for (const r of rows) {
      await tx`
        insert into order_items (order_id, product_id, product_name, sku, unit_price, quantity, line_total)
        values (${created['id'] as string}, ${r.product_id}, ${r.product_name}, ${r.sku},
          ${r.unit_price}, ${r.quantity}, ${r.line_total})`;
      await tx`
        update products set stock_quantity = stock_quantity - ${r.quantity}, updated_at = now()
        where id = ${r.product_id}`;
    }

    const existingCustomer = await tx`
      select id from customers where lower(email) = lower(${input.email}) limit 1`;
    if (!existingCustomer[0]) {
      await tx`
        insert into customers (full_name, email, phone)
        values (${customerName}, ${input.email}, ${input.phone})`;
    }

    return { order: created, items: rows };
  });
}

/** Attaches a Stripe Checkout session to an order before the buyer is redirected. */
export async function attachStripeSession(orderId: string, sessionId: string) {
  const sql = getDb();
  await sql`
    update orders
    set payment_provider = 'stripe', stripe_session_id = ${sessionId}, updated_at = now()
    where id = ${orderId}`;
}

/**
 * Marks an order paid. Idempotent: repeated webhook deliveries for the same
 * session leave the order untouched after the first successful sync.
 */
export async function markOrderPaid(params: {
  sessionId: string;
  paymentIntentId: string | null;
  paymentMethod: string | null;
  orderNumber?: string | null;
}) {
  const sql = getDb();
  const rows = await sql`
    update orders
    set payment_status = 'paid',
        status = case when status = 'pending' then 'confirmed' else status end,
        payment_provider = 'stripe',
        payment_method = coalesce(${params.paymentMethod}, payment_method),
        stripe_session_id = coalesce(stripe_session_id, ${params.sessionId}),
        stripe_payment_intent_id = coalesce(${params.paymentIntentId}, stripe_payment_intent_id),
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
    where (stripe_session_id = ${params.sessionId}
           or order_number = ${params.orderNumber ?? null})
      and payment_status <> 'paid'
    returning id, order_number, payment_status`;
  return rows[0] ?? null;
}

/** Cancels an order whose Stripe session expired without payment. */
export async function expireStripeOrder(sessionId: string) {
  const sql = getDb();
  await sql`
    update orders
    set status = 'cancelled', updated_at = now()
    where stripe_session_id = ${sessionId} and payment_status = 'unpaid'`;
}
