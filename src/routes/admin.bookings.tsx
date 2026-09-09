import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { bookingApi, type Booking } from "@/lib/admin-api";

const title = "Bookings — Mayor Beauty Place Admin";
const description = "Manage salon appointments, payments and schedules.";

const STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"];

type FilterKey = "all" | "pending_payment" | "uncompleted" | "completed" | "cancelled";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All Bookings" },
  { key: "pending_payment", label: "Pending Payment" },
  { key: "uncompleted", label: "Uncompleted" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function matches(b: Booking, filter: FilterKey) {
  const paid = (b.payment_status ?? "unpaid") === "paid";
  switch (filter) {
    case "pending_payment":
      return !paid && b.status !== "cancelled";
    case "uncompleted":
      return b.status !== "completed" && b.status !== "cancelled";
    case "completed":
      return b.status === "completed";
    case "cancelled":
      return b.status === "cancelled";
    default:
      return true;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export const Route = createFileRoute("/admin/bookings")({
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
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: bookingApi.bookings,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status?: string;
      payment_status?: string;
    }) => bookingApi.updateBooking(id, body),
    onSuccess: () => {
      toast.success("Booking updated");
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => bookingApi.deleteBooking(id),
    onSuccess: () => {
      toast.success("Booking deleted");
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bookings = useMemo(() => data?.bookings ?? [], [data]);
  const stats = data?.stats;

  const cards = useMemo(() => {
    const paid = bookings.filter((b) => b.payment_status === "paid").length;
    return [
      { label: "Total Bookings", value: stats?.total ?? bookings.length },
      { label: "Paid Bookings", value: stats?.paid ?? paid },
      {
        label: "Pending Payments",
        value:
          stats?.pending_payment ??
          bookings.filter((b) => matches(b, "pending_payment")).length,
      },
      {
        label: "Completed Bookings",
        value: stats?.completed ?? bookings.filter((b) => b.status === "completed").length,
      },
      {
        label: "Cancelled Bookings",
        value: stats?.cancelled ?? bookings.filter((b) => b.status === "cancelled").length,
      },
    ];
  }, [bookings, stats]);

  const visible = bookings.filter((b) => matches(b, filter));
  const openBooking = bookings.find((b) => b.id === openId) ?? null;

  return (
    <AdminShell title="Bookings" description={description}>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl">{c.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = bookings.filter((b) => matches(b, f.key)).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                active
                  ? "border-brand-blue bg-brand-blue text-white"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
          </div>
        ) : visible.length === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-display text-xl">No bookings here</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bookings made on the Book A Service page appear here.
            </p>
          </section>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Booking date</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Booking status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.full_name}</div>
                      <div className="text-xs text-muted-foreground">{b.email}</div>
                      {b.phone && (
                        <div className="text-xs text-muted-foreground">{b.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {b.booking_reference ?? b.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(b.preferred_date)}
                      <div className="text-xs text-muted-foreground">
                        {b.preferred_time ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {b.items && b.items.length > 0 ? b.items[0]!.service_name : b.service}
                      <div className="text-xs text-muted-foreground">
                        {b.items && b.items.length > 1
                          ? `+ ${b.items.length - 1} more service${b.items.length > 2 ? "s" : ""}`
                          : b.category_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">£{Number(b.price ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={b.payment_status ?? "unpaid"}
                        onChange={(e) =>
                          update.mutate({ id: b.id, payment_status: e.target.value })
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs capitalize"
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {b.paid_at && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {formatDateTime(b.paid_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-muted-foreground">
                      {b.payment_method ?? b.payment_provider ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        onChange={(e) => update.mutate({ id: b.id, status: e.target.value })}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs capitalize"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(b.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setOpenId(b.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-brand-blue"
                        aria-label="View booking"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Delete this booking?")) remove.mutate(b.id);
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-brand-red"
                        aria-label="Delete booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openBooking && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">Booking details</h2>
                <p className="font-mono text-xs text-muted-foreground">
                  {openBooking.booking_reference ?? openBooking.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Customer" value={openBooking.full_name} />
              <Field label="Email" value={openBooking.email} />
              <Field label="Phone" value={openBooking.phone ?? "—"} />
              <Field
                label="Booking date"
                value={`${formatDate(openBooking.preferred_date)} ${openBooking.preferred_time ?? ""}`}
              />
              <Field label="Booking status" value={openBooking.status.replace("_", " ")} />
              <Field
                label="Payment status"
                value={openBooking.payment_status ?? "unpaid"}
              />
              <Field
                label="Payment method"
                value={openBooking.payment_method ?? openBooking.payment_provider ?? "—"}
              />
              <Field
                label="Transaction reference"
                value={openBooking.stripe_payment_intent_id ?? "—"}
              />
              <Field label="Created" value={formatDateTime(openBooking.created_at)} />
              <Field label="Paid at" value={formatDateTime(openBooking.paid_at)} />
            </div>

            <div className="mt-6 rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Service</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(openBooking.items && openBooking.items.length > 0
                    ? openBooking.items
                    : [
                        {
                          id: openBooking.id,
                          service_name: openBooking.service ?? "Service",
                          category_name: openBooking.category_name,
                          quantity: 1,
                          unit_price: openBooking.price ?? 0,
                          line_total: openBooking.price ?? 0,
                        },
                      ]
                  ).map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2">
                        {item.service_name}
                        <div className="text-xs text-muted-foreground">
                          {item.category_name ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">£{Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">
                        £{Number(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm font-medium">Total amount</span>
                <span className="font-display text-xl">
                  £{Number(openBooking.price ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {openBooking.notes && (
              <p className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                {openBooking.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm capitalize">{value || "—"}</p>
    </div>
  );
}
