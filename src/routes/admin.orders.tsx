import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminApi } from "@/lib/admin-api";
import { formatPrice } from "@/lib/cart";

const title = "Orders — Mayor Beauty Place Admin";
const description = "Track and manage customer orders.";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

export const Route = createFileRoute("/admin/orders")({
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
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: () => adminApi.orders(statusFilter ? `?status=${statusFilter}` : ""),
  });

  const detail = useQuery({
    queryKey: ["admin-order", openId],
    queryFn: () => adminApi.order(openId as string),
    enabled: !!openId,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: string; payment_status?: string } }) =>
      adminApi.updateOrder(id, body),
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order", openId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const orders = list.data?.orders ?? [];

  return (
    <AdminShell title="Orders" description="Track and manage customer orders.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="status-filter" className="text-xs tracking-widest uppercase">
          Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-border bg-card">
        {list.isLoading ? (
          <p className="p-8 text-sm text-muted-foreground">Loading orders…</p>
        ) : list.isError ? (
          <p className="p-8 text-sm text-destructive">Could not load orders.</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-widest text-muted-foreground uppercase">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="p-4 font-sans font-medium text-xs">{o.order_number}</td>
                  <td className="p-4">
                    {o.customer_name ?? (`${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() || "—")}
                  </td>
                  <td className="p-4">{o.email ?? "—"}</td>
                  <td className="p-4">{o.phone ?? "—"}</td>
                  <td className="p-4 font-semibold">{formatPrice(o.total)}</td>
                  <td className="p-4 capitalize">{o.payment_status}</td>
                  <td className="p-4 capitalize">{o.status}</td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => setOpenId(o.id)}
                      className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:bg-secondary"
                    >
                      View Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {openId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-6">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl">
                Order {detail.data?.order.order_number ?? ""}
              </h2>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-full border border-border px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            {detail.isLoading || !detail.data ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
                  <Info
                    label="Customer"
                    value={`${detail.data.order.first_name ?? ""} ${detail.data.order.last_name ?? ""}`.trim()}
                  />
                  <Info label="Email" value={detail.data.order.email ?? "—"} />
                  <Info label="Phone" value={detail.data.order.phone ?? "—"} />
                  <Info
                    label="Delivery address"
                    value={[
                      detail.data.order.address,
                      detail.data.order.city,
                      detail.data.order.state,
                      detail.data.order.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  <Info label="Notes" value={detail.data.order.notes || "—"} />
                </div>

                <ul className="mt-6 space-y-2">
                  {detail.data.items.map((i, idx) => (
                    <li
                      key={i.id ?? idx}
                      className="flex justify-between rounded-xl border border-border p-3 text-sm"
                    >
                      <span>
                        {i.product_name}
                        <span className="block text-xs text-muted-foreground">
                          {i.quantity} × {formatPrice(i.unit_price)}
                          {i.sku ? ` · ${i.sku}` : ""}
                        </span>
                      </span>
                      <span className="font-semibold">{formatPrice(i.line_total)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-1 text-sm">
                  <Row label="Subtotal" value={formatPrice(detail.data.order.subtotal)} />
                  <Row label="Delivery fee" value={formatPrice(detail.data.order.delivery_fee)} />
                  <Row label="Total" value={formatPrice(detail.data.order.total)} strong />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="order-status" className="text-xs tracking-widest uppercase">
                      Order status
                    </label>
                    <select
                      id="order-status"
                      value={detail.data.order.status}
                      onChange={(e) =>
                        update.mutate({ id: openId, body: { status: e.target.value } })
                      }
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="payment-status" className="text-xs tracking-widest uppercase">
                      Payment status
                    </label>
                    <select
                      id="payment-status"
                      value={detail.data.order.payment_status}
                      onChange={(e) =>
                        update.mutate({ id: openId, body: { payment_status: e.target.value } })
                      }
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-1">{value || "—"}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string | null; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-display text-xl text-brand-red" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
