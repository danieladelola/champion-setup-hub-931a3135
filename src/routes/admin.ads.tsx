import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { ImageUpload } from "@/components/admin/image-upload";
import { adminApi, type Ad } from "@/lib/admin-api";
import { AD_DISPLAY_TYPES, AD_PLACEMENTS } from "@/lib/ads.server";

const title = "Ads — Mayor Beauty Place Admin";
const description = "Create and manage website adverts and their placements.";

export const Route = createFileRoute("/admin/ads")({
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

type FormState = {
  title: string;
  image_url: string;
  link_url: string;
  placement: string;
  sort_order: string;
  active: boolean;
  display_type: "embed" | "popup";
  starts_at: string;
  ends_at: string;
  popup_delay_seconds: string;
};

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm: FormState = {
  title: "",
  image_url: "",
  link_url: "",
  placement: AD_PLACEMENTS[0].value,
  sort_order: "0",
  active: true,
  display_type: "embed",
  starts_at: "",
  ends_at: "",
  popup_delay_seconds: "3",
};

function toForm(a: Ad): FormState {
  return {
    title: a.title ?? "",
    image_url: a.image_url,
    link_url: a.link_url ?? "",
    placement: a.placement,
    sort_order: String(a.sort_order ?? 0),
    active: a.active,
    display_type: a.display_type ?? "embed",
    starts_at: toLocalInput(a.starts_at),
    ends_at: toLocalInput(a.ends_at),
    popup_delay_seconds: String(a.popup_delay_seconds ?? 3),
  };
}

function toPayload(f: FormState) {
  return {
    title: f.title.trim(),
    image_url: f.image_url.trim(),
    link_url: f.link_url.trim() || null,
    placement: f.placement,
    sort_order: Number(f.sort_order || 0),
    active: f.active,
    display_type: f.display_type,
    starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
    ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
    popup_delay_seconds: Number(f.popup_delay_seconds || 0),
  };
}

function fmt(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function scheduleLabel(ad: Ad) {
  const from = fmt(ad.starts_at);
  const to = fmt(ad.ends_at);
  const now = Date.now();
  if (ad.ends_at && new Date(ad.ends_at).getTime() <= now) return `Ended ${to}`;
  if (ad.starts_at && new Date(ad.starts_at).getTime() > now)
    return to ? `Scheduled ${from} → ${to}` : `Scheduled from ${from}`;
  if (to) return `Running until ${to}`;
  return "Always on (no end date)";
}

function placementLabel(value: string) {
  return AD_PLACEMENTS.find((p) => p.value === value)?.label ?? value;
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Page() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "ads"],
    queryFn: () => adminApi.ads(),
    retry: false,
  });

  const items = data?.ads ?? [];

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin", "ads"] });
    qc.invalidateQueries({ queryKey: ["ads"] });
  }

  const save = useMutation({
    mutationFn: (f: FormState) =>
      editing ? adminApi.updateAd(editing.id, toPayload(f)) : adminApi.createAd(toPayload(f)),
    onSuccess: () => {
      toast.success(editing ? "Ad updated" : "Ad created");
      setForm(null);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.setAdActive(id, active),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteAd(id),
    onSuccess: () => {
      toast.success("Ad deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.image_url.trim()) {
      toast.error("Please upload an ad image");
      return;
    }
    save.mutate(form);
  }

  return (
    <AdminShell title="Ads" description="Upload adverts and choose where they appear.">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "ad" : "ads"}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-on-brand transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> New ad
        </button>
      </div>

      {form ? (
        <form onSubmit={submit} className="mb-8 grid gap-5 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{editing ? "Edit ad" : "New ad"}</h2>
          <Field label="Internal name (optional)">
            <input
              className={inputCls}
              value={form.title}
              maxLength={200}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Summer promo banner"
            />
          </Field>
          <Field label="Ad image">
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              label="Upload ad image"
            />
          </Field>
          <Field label="Destination link (optional)">
            <input
              className={inputCls}
              value={form.link_url}
              maxLength={1000}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://example.com/offer"
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Placement">
              <select
                className={inputCls}
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
              >
                {AD_PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="How it shows">
              <select
                className={inputCls}
                value={form.display_type}
                onChange={(e) =>
                  setForm({ ...form, display_type: e.target.value as "embed" | "popup" })
                }
              >
                {AD_DISPLAY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            {form.display_type === "popup" ? (
              <Field label="Popup delay (seconds)">
                <input
                  type="number"
                  min={0}
                  max={120}
                  className={inputCls}
                  value={form.popup_delay_seconds}
                  onChange={(e) => setForm({ ...form, popup_delay_seconds: e.target.value })}
                />
              </Field>
            ) : null}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Start showing (optional)">
              <input
                type="datetime-local"
                className={inputCls}
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </Field>
            <Field label="Stop showing (optional)">
              <input
                type="datetime-local"
                className={inputCls}
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Leave the dates empty to run the ad until you switch it off.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active (shown on the website)
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Save changes" : "Create ad"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(null);
                setEditing(null);
              }}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {(error as Error).message}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No ads yet. Create your first one.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((ad) => (
            <article key={ad.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <img
                src={ad.image_url}
                alt={ad.title || "Ad"}
                className="block h-auto w-full bg-secondary object-contain"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg">{ad.title || "Untitled ad"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {placementLabel(ad.placement)} · order {ad.sort_order} ·{" "}
                      {ad.display_type === "popup" ? "popup" : "banner"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{scheduleLabel(ad)}</p>
                    {ad.link_url ? (
                      <a
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-brand-blue"
                      >
                        <ExternalLink className="h-3 w-3" /> {ad.link_url}
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Image only (no link)</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      aria-label="Edit ad"
                      onClick={() => {
                        setEditing(ad);
                        setForm(toForm(ad));
                      }}
                      className="rounded-full border border-border p-2 hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete ad"
                      onClick={() => {
                        if (confirm("Delete this ad?")) remove.mutate(ad.id);
                      }}
                      className="rounded-full border border-border p-2 text-brand-red hover:bg-secondary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ id: ad.id, active: !ad.active })}
                  className={`mt-4 rounded-full px-4 py-1.5 text-xs font-semibold ${
                    ad.active ? "bg-brand-blue text-on-brand" : "border border-border"
                  }`}
                >
                  {ad.active ? "Active" : "Inactive"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
