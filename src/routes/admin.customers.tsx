import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminApi, type Customer } from "@/lib/admin-api";

const title = "Customers — Mayor Beauty Place Admin";
const description = "Browse your customer directory.";

export const Route = createFileRoute("/admin/customers")({
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

function initials(name: string | null, email: string) {
  const base = (name ?? email).trim();
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Page() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: adminApi.customers,
  });

  const customers = useMemo(() => {
    const list = data?.customers ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      [c.full_name, c.email, c.phone, c.city].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [data, search]);

  return (
    <AdminShell title="Customers" description="Your full customer directory.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone or city"
            className="w-full rounded-full border border-border bg-card py-2.5 pr-4 pl-9 text-sm focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
          />
        </div>
        <span className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {customers.length} customers
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      ) : customers.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="font-display text-xl">No customers found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different search term.
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-blue">
                        {initials(c.full_name, c.email)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{c.full_name ?? "—"}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">{c.order_count}</td>
                  <td className="px-4 py-3">{c.booking_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-brand-blue hover:text-on-brand"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-card p-8 shadow-lift">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl">{selected.full_name ?? selected.email}</h2>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelected(null)}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {[
                ["Phone", selected.phone],
                ["Address", selected.address],
                ["City", selected.city],
                ["Postcode", selected.postcode],
                ["Country", selected.country],
                ["Source", selected.source],
                ["Orders", String(selected.order_count)],
                ["Total spent", `£${Number(selected.total_spent ?? 0).toFixed(2)}`],
                ["Bookings", String(selected.booking_count)],
                ["Joined", fmtDate(selected.created_at)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs tracking-wider text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {selected.notes && (
              <p className="mt-6 rounded-2xl bg-secondary p-4 text-sm">{selected.notes}</p>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
