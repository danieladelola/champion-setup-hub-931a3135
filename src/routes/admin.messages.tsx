import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, MailOpen, Phone, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminApi, type Message } from "@/lib/admin-api";

const title = "Messages — Mayor Beauty Place Admin";
const description = "Read enquiries submitted from the contact page.";

export const Route = createFileRoute("/admin/messages")({
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

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Page() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selected, setSelected] = useState<Message | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: adminApi.messages,
  });

  const setRead = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      adminApi.updateMessage(id, { read }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteMessage(id),
    onSuccess: () => {
      toast.success("Message deleted");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const messages = useMemo(() => {
    const list = data?.messages ?? [];
    return filter === "unread" ? list.filter((m) => !m.read) : list;
  }, [data, filter]);

  const unread = (data?.messages ?? []).filter((m) => !m.read).length;

  function open(m: Message) {
    setSelected(m);
    if (!m.read) setRead.mutate({ id: m.id, read: true });
  }

  return (
    <AdminShell title="Messages" description="Enquiries submitted from the contact page.">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
              filter === f
                ? "bg-brand-blue text-on-brand"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f === "all" ? `All (${data?.messages.length ?? 0})` : `Unread (${unread})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      ) : messages.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="font-display text-xl">No messages</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enquiries sent from the contact page appear here.
          </p>
        </section>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-card transition-colors ${
                m.read ? "border-border" : "border-brand-blue/40 bg-brand-blue/[0.03]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  m.read ? "bg-secondary text-muted-foreground" : "bg-brand-blue/10 text-brand-blue"
                }`}
              >
                {m.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </span>
              <button
                type="button"
                onClick={() => open(m)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{m.full_name ?? m.email}</span>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  {!m.read && (
                    <span className="rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-semibold tracking-wider text-on-brand uppercase">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</p>
              </button>
              <button
                type="button"
                aria-label="Delete message"
                onClick={() => remove.mutate(m.id)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-brand-red/10 hover:text-brand-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-8 shadow-lift">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl">
                  {selected.subject ?? "Contact enquiry"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fmtDateTime(selected.created_at)}
                </p>
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

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-secondary p-5 text-sm sm:grid-cols-3">
              {[
                ["Name", selected.full_name],
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["Location", [selected.city, selected.country].filter(Boolean).join(", ")],
                ["Orders placed", String(selected.order_count)],
                ["Bookings made", String(selected.booking_count)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs tracking-wider text-muted-foreground uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words">{value || "—"}</dd>
                </div>
              ))}
            </div>

            <p className="mt-6 leading-relaxed whitespace-pre-wrap">{selected.message}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-sm font-medium text-on-brand"
              >
                <Mail className="h-4 w-4" /> Reply by email
              </a>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
              <button
                type="button"
                onClick={() => setRead.mutate({ id: selected.id, read: !selected.read })}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
              >
                Mark as {selected.read ? "unread" : "read"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
