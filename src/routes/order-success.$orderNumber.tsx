import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3 } from "lucide-react";

import { publicApi } from "@/lib/admin-api";
import { formatPrice } from "@/lib/cart";

export const Route = createFileRoute("/order-success/$orderNumber")({
  head: () => {
    const title = "Order Confirmed — Mayor Beauty Place";
    const description = "Thank you for your order at Mayor Beauty Place.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { orderNumber } = Route.useParams();
  const { session_id } = Route.useSearch();

  // Ask Stripe directly before showing a confirmation; the webhook may lag.
  const verify = useQuery({
    queryKey: ["payment-status", session_id],
    queryFn: () => publicApi.verifyPayment(session_id!),
    enabled: !!session_id,
    retry: 2,
    refetchInterval: (q) => (q.state.data?.paid ? false : 3000),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", orderNumber, verify.data?.paid ?? false],
    queryFn: () => publicApi.order(orderNumber),
    retry: false,
  });

  const paid = data?.order.payment_status === "paid" || verify.data?.paid === true;

  return (
    <main className="px-6 pt-40 pb-24 md:px-12 md:pt-52">
      <div className="mx-auto max-w-3xl">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
        ) : isError || !data ? (
          <div className="text-center">
            <h1 className="font-display text-4xl">Order not found</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We couldn't find order {orderNumber}.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-xs font-semibold text-on-dark hover:bg-brand-blue"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 text-brand-blue">
              {paid ? <CheckCircle2 className="h-8 w-8" /> : <Clock3 className="h-8 w-8" />}
              <h1 className="font-display text-4xl text-foreground">
                {paid ? "Thank you for your order!" : "Payment is being confirmed…"}
              </h1>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {paid
                ? "We've received your payment and your order is confirmed."
                : "Pay-later methods can take a moment to settle. This page updates automatically once Stripe confirms the payment."}
            </p>
            <div className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
              <Detail label="Order Number" value={data.order.order_number} />
              <Detail
                label="Customer Name"
                value={
                  data.order.customer_name ??
                  `${data.order.first_name ?? ""} ${data.order.last_name ?? ""}`.trim()
                }
              />
              <Detail label="Order Total" value={formatPrice(data.order.total) ?? "—"} />
              <Detail label="Order Status" value={data.order.status} />
              <Detail label="Payment Status" value={data.order.payment_status} />
            </div>

            <h2 className="mt-10 font-display text-2xl">Products ordered</h2>
            <ul className="mt-4 space-y-3">
              {data.items.map((item, i) => (
                <li
                  key={item.id ?? i}
                  className="flex justify-between gap-4 rounded-2xl border border-border bg-card p-4 text-sm"
                >
                  <span>
                    {item.product_name}
                    <span className="block text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.unit_price)}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </span>
                  </span>
                  <span className="font-semibold">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/shop"
              className="mt-10 inline-flex rounded-full bg-ink px-7 py-3.5 text-xs font-semibold text-on-dark hover:bg-brand-blue"
            >
              Continue Shopping
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
