import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { BookingError, createPendingBooking } from "@/lib/bookings.server";
import { multiBookingSchema } from "@/lib/services.server";

/**
 * Creates a booking without payment (request-only services and older clients
 * that post a single `service_id`). Multi-service bookings post `items`.
 */
export const Route = createFileRoute("/api/bookings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = multiBookingSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid booking details" },
            { status: 400 },
          );
        }
        try {
          const { booking, items } = await createPendingBooking(parsed.data);
          return json({ booking: { ...booking, items } }, { status: 201 });
        } catch (err) {
          if (err instanceof BookingError) {
            return json({ error: err.message }, { status: err.status });
          }
          console.error("POST /api/bookings failed", err);
          return json({ error: "Could not create the booking" }, { status: 500 });
        }
      },
    },
  },
});
