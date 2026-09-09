import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const serviceSchema = z.object({
  category_id: z.string().uuid("Select a category"),
  name: z.string().trim().min(1, "Service name is required").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0).max(1_000_000).default(0),
  duration_minutes: z.coerce.number().int().min(5).max(1440).default(60),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const bookingSchema = z.object({
  service_id: z.string().uuid("Select a service"),
  full_name: z.string().trim().min(1, "Full name is required").max(140),
  email: z.string().trim().email("A valid email is required").max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  preferred_date: z.string().trim().min(1, "Select a date"),
  preferred_time: z.string().trim().min(1, "Select a time"),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const bookingItemSchema = z.object({
  service_id: z.string().uuid("Select a service"),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

/**
 * One booking can hold several services paid for together. A single
 * `service_id` is still accepted so older clients keep working.
 */
export const multiBookingSchema = bookingSchema
  .omit({ service_id: true })
  .extend({
    service_id: z.string().uuid().optional(),
    items: z.array(bookingItemSchema).min(1).max(20).optional(),
  })
  .transform((value) => {
    const items =
      value.items && value.items.length > 0
        ? value.items
        : value.service_id
          ? [{ service_id: value.service_id, quantity: 1 }]
          : [];
    return { ...value, items };
  })
  .refine((value) => value.items.length > 0, {
    message: "Select at least one service",
    path: ["items"],
  });

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const BOOKING_PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
] as const;
