import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { ImageUpload } from "@/components/admin/image-upload";
import { adminApi, type Transformation } from "@/lib/admin-api";

const title = "Gallery — Mayor Beauty Place Admin";
const description = "Manage before-and-after gallery images.";

export const Route = createFileRoute("/admin/gallery")({
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
  name: string;
  description: string;
  before_image_url: string;
  after_image_url: string;
  sort_order: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  before_image_url: "",
  after_image_url: "",
  sort_order: "0",
  active: true,
};

function toForm(t: Transformation): FormState {
  return {
    name: t.name,
    description: t.description ?? "",
    before_image_url: t.before_image_url,
    after_image_url: t.after_image_url,
    sort_order: String(t.sort_order ?? 0),
    active: t.active,
  };
}

function toPayload(f: FormState) {
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    before_image_url: f.before_image_url.trim(),
    after_image_url: f.after_image_url.trim(),
    sort_order: Number(f.sort_order || 0),
    active: f.active,
  };
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
  const [editing, setEditing] = useState<Transformation | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "transformations"],
    queryFn: () => adminApi.transformations(),
    retry: false,
  });

  const items = data?.transformations ?? [];

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin", "transformations"] });
    qc.invalidateQueries({ queryKey: ["transformations"] });
  }

  const save = useMutation({
    mutationFn: (f: FormState) =>
      editing
        ? adminApi.updateTransformation(editing.id, toPayload(f))
        : adminApi.createTransformation(toPayload(f)),
    onSuccess: () => {
      toast.success(editing ? "Entry updated" : "Entry created");
      setForm(null);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteTransformation(id),
    onSuccess: () => {
      toast.success("Entry deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.before_image_url.trim()) {
      toast.error("Before image is required");
      return;
    }
    if (!form.after_image_url.trim()) {
      toast.error("After image is required");
      return;
    }
    save.mutate(form);
  }

  return (
    <AdminShell title="Gallery" description="Manage before-and-after gallery entries.">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "entry" : "entries"}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-on-brand transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> New entry
        </button>
      </div>

      {form ? (
        <form
          onSubmit={submit}
          className="mb-8 grid gap-5 rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="font-display text-xl">
            {editing ? "Edit entry" : "New before & after entry"}
          </h2>
          <Field label="Name">
            <input
              className={inputCls}
              value={form.name}
              maxLength={200}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Glam Cut & Color"
            />
          </Field>
          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short note about the transformation"
            />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Before image">
              <ImageUpload
                value={form.before_image_url}
                onChange={(url) => setForm({ ...form, before_image_url: url })}
                label="Upload before"
              />
            </Field>
            <Field label="After image">
              <ImageUpload
                value={form.after_image_url}
                onChange={(url) => setForm({ ...form, after_image_url: url })}
                label="Upload after"
              />
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Sort order">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Visible on the Before &amp; After page
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-sm font-semibold text-on-brand disabled:opacity-60"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Save changes" : "Create entry"}
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
          No gallery entries yet. Create your first one.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((t) => (
            <article key={t.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="grid grid-cols-2 gap-1">
                <img
                  src={t.before_image_url}
                  alt={`Before — ${t.name}`}
                  className="aspect-[3/4] w-full object-cover"
                />
                <img
                  src={t.after_image_url}
                  alt={`After — ${t.name}`}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg">{t.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.active ? "Visible" : "Hidden"} · order {t.sort_order}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Edit entry"
                      onClick={() => {
                        setEditing(t);
                        setForm(toForm(t));
                      }}
                      className="rounded-full border border-border p-2 hover:bg-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete entry"
                      onClick={() => {
                        if (confirm(`Delete "${t.name}"?`)) remove.mutate(t.id);
                      }}
                      className="rounded-full border border-border p-2 text-brand-red hover:bg-secondary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {t.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
