import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import {
  attachBookingSession,
  BookingError,
  createPendingBooking,
} from "@/lib/bookings.server";
import { multiBookingSchema } from "@/lib/services.server";
import {
  createBookingCheckoutSession,
  getStripeSecretKey,
  StripeConfigError,
} from "@/lib/stripe.server";

export const Route = createFileRoute("/api/booking-checkout-session")({
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
          getStripeSecretKey();

          const { booking, price, items } = await createPendingBooking(parsed.data);
          const reference = booking["booking_reference"] as string;

          // Services without an online price are request-only: there is nothing
          // to charge, so the booking stays pending until the salon confirms.
          if (!(price > 0)) {
            return json(
              { url: null, booking_reference: reference, requires_payment: false },
              { status: 201 },
            );
          }

          // One Stripe session, one line per chosen service.
          const session = await createBookingCheckoutSession({
            bookingId: booking["id"] as string,
            reference,
            email: parsed.data.email,
            lines: items
              .filter((i) => i.unit_price > 0)
              .map((i) => ({
                name: i.service_name,
                unit_price: i.unit_price,
                quantity: i.quantity,
              })),
            origin: new URL(request.url).origin,
          });

          await attachBookingSession(booking["id"] as string, session.id);

          if (!session.url) {
            return json({ error: "Could not start the payment session" }, { status: 502 });
          }
          return json(
            { url: session.url, booking_reference: reference, requires_payment: true },
            { status: 201 },
          );
        } catch (err) {
          if (err instanceof BookingError) {
            return json({ error: err.message }, { status: err.status });
          }
          if (err instanceof StripeConfigError) {
            console.error("stripe config", err.message);
            return json({ error: "Payments are not configured yet." }, { status: 503 });
          }
          console.error("booking checkout error", err);
          return json({ error: "Could not start checkout" }, { status: 500 });
        }
      },
    },
  },
});
