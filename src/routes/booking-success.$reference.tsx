import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3 } from "lucide-react";

import { bookingPublicApi, publicApi } from "@/lib/admin-api";

const title = "Booking Confirmed — Mayor Beauty Place";
const description = "Your Mayor Beauty Place appointment is confirmed.";

export const Route = createFileRoute("/booking-success/$reference")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  component: BookingSuccess,
});

function BookingSuccess() {
  const { reference } = Route.useParams();
  const { session_id } = Route.useSearch();

  // Confirm with Stripe first; the webhook may not have landed yet.
  const verify = useQuery({
    queryKey: ["payment-status", session_id],
    queryFn: () => publicApi.verifyPayment(session_id!),
    enabled: !!session_id,
    retry: 2,
    refetchInterval: (q) => (q.state.data?.paid ? false : 3000),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking", reference, verify.data?.paid ?? false],
    queryFn: () => bookingPublicApi.byReference(reference),
    retry: false,
  });

  const booking = data?.booking;
  const paid = booking?.payment_status === "paid" || verify.data?.paid === true;

  return (
    <main className="px-6 pt-40 pb-24 md:px-12 md:pt-52">
      <div className="mx-auto max-w-3xl">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
        ) : isError || !booking ? (
          <div className="text-center">
            <h1 className="font-display text-4xl">Booking not found</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We couldn't find booking {reference}.
            </p>
            <Link
              to="/book"
              className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-xs font-semibold text-on-dark hover:bg-brand-blue"
            >
              Book again
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 text-brand-blue">
              {paid ? <CheckCircle2 className="h-8 w-8" /> : <Clock3 className="h-8 w-8" />}
              <h1 className="font-display text-4xl text-foreground">
                {paid ? "Your appointment is confirmed!" : "Payment is being confirmed…"}
              </h1>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {paid
                ? "We've received your payment and reserved your slot. A member of the team will be in touch shortly."
                : "Pay-later methods can take a moment to settle. This page updates automatically once Stripe confirms the payment."}
            </p>

            {booking.items && booking.items.length > 0 ? (
              <div className="mt-8 rounded-3xl border border-border bg-card p-6">
                <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Services in this booking
                </p>
                <ul className="mt-3 space-y-2">
                  {booking.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
                      <span>
                        {item.service_name}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                      </span>
                      <span className="font-semibold">
                        £{Number(item.line_total).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-xl">
                    £{Number(booking.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
              <Detail label="Booking Reference" value={booking.booking_reference} />
              <Detail label="Name" value={booking.full_name ?? "—"} />
              <Detail label="Services" value={booking.service ?? "—"} />
              <Detail
                label="Date & Time"
                value={`${booking.preferred_date ?? "—"} · ${booking.preferred_time ?? "—"}`}
              />
              <Detail label="Duration" value={`${booking.duration_minutes} minutes`} />
              <Detail label="Amount" value={`£${Number(booking.price).toFixed(2)}`} />
              <Detail label="Payment" value={booking.payment_status} />
              <Detail label="Booking Status" value={booking.status} />
            </div>

            <Link
              to="/"
              className="mt-10 inline-flex rounded-full bg-ink px-7 py-3.5 text-xs font-semibold text-on-dark hover:bg-brand-blue"
            >
              Back to home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
