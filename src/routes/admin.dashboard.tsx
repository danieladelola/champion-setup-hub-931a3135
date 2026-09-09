import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarCheck,
  Mail,
  Package,
  PoundSterling,
  ShoppingCart,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminApi } from "@/lib/admin-api";

const title = "Admin Dashboard — Mayor Beauty Place";
const description = "Overview of products, orders, bookings and customers at Mayor Beauty Place.";

export const Route = createFileRoute("/admin/dashboard")({
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
  component: Dashboard,
});

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
} as const;

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-border bg-card p-6 shadow-card ${className}`}
    >
      <h2 className="font-display text-xl leading-tight">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">{label}</p>;
}

function Dashboard() {
  const { data } = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats, retry: false });

  const revenue = Number(data?.counts.revenue ?? 0);

  const cards = [
    {
      label: "Revenue",
      value: `£${revenue.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`,
      icon: PoundSterling,
      tone: "bg-chart-1/10 text-chart-1",
    },
    { label: "Orders", value: data?.counts.orders, icon: ShoppingCart, tone: "bg-chart-2/10 text-chart-2" },
    { label: "Bookings", value: data?.counts.bookings, icon: CalendarCheck, tone: "bg-chart-3/10 text-chart-3" },
    { label: "Customers", value: data?.counts.customers, icon: Users, tone: "bg-chart-4/10 text-chart-4" },
    { label: "Products", value: data?.counts.products, icon: Package, tone: "bg-chart-5/10 text-chart-5" },
    {
      label: "Unread messages",
      value: data?.counts.unread_messages,
      icon: Mail,
      tone: "bg-brand-red/10 text-brand-red",
    },
  ];

  const monthly = (data?.monthly ?? []).map((m) => ({
    label: m.label,
    orders: m.orders,
    bookings: m.bookings,
    revenue: Number(m.revenue),
  }));

  const orderStatus = data?.orderStatus ?? [];
  const bookingStatus = data?.bookingStatus ?? [];

  return (
    <AdminShell title="Dashboard" description="Performance at a glance">
      <div className="rounded-3xl bg-ink p-6 text-on-dark shadow-lift md:p-8">
        <span className="text-[11px] tracking-[0.3em] text-on-dark/60 uppercase">
          Mayor Beauty Place
        </span>
        <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">
          Business <em className="text-brand-red italic">Overview</em>
        </h2>
        <p className="mt-2 max-w-xl text-sm text-on-dark/70">
          Live figures across your shop, salon bookings and customer directory.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-3xl border border-border bg-card p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  {c.label}
                </span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${c.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 font-display text-4xl">{c.value ?? "—"}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Orders & bookings"
          subtitle="Last 6 months"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="orders" name="Orders" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Order status" subtitle="Share of all orders">
          {orderStatus.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {orderStatus.map((entry, i) => (
                      <Cell key={entry.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label="No orders yet." />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Revenue trend" subtitle="Last 6 months" className="lg:col-span-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`£${Number(v).toFixed(2)}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--chart-2)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Booking status" subtitle="Share of all bookings">
          {bookingStatus.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatus}
                    dataKey="value"
                    nameKey="label"
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {bookingStatus.map((entry, i) => (
                      <Cell key={entry.label} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label="No bookings yet." />
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Recent Orders">
          {data?.recentOrders.length ? (
            <ul className="space-y-3 text-sm">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3">
                  <span>{o.customer_name}</span>
                  <span className="text-muted-foreground">
                    £{Number(o.total).toFixed(2)} · {o.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="No orders yet." />
          )}
        </Panel>

        <Panel title="Recent Bookings">
          {data?.recentBookings.length ? (
            <ul className="space-y-3 text-sm">
              {data.recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3">
                  <span>{b.customer_name}</span>
                  <span className="text-muted-foreground">{b.service ?? b.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="No bookings yet." />
          )}
        </Panel>

        <Panel title="Low Stock Products">
          {data?.lowStock.length ? (
            <ul className="space-y-3 text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span>{p.name}</span>
                  <span className="text-brand-red">{p.stock_quantity} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty label="Stock levels are healthy." />
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
