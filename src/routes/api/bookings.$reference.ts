import { createFileRoute } from "@tanstack/react-router";

import { json } from "@/lib/auth.server";
import { getBookingByReference } from "@/lib/bookings.server";

export const Route = createFileRoute("/api/bookings/$reference")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const booking = await getBookingByReference(params.reference);
        if (!booking) return json({ error: "Booking not found" }, { status: 404 });
        return json({ booking });
      },
    },
  },
});
