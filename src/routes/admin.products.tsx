import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/admin/image-upload";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminApi, type Product } from "@/lib/admin-api";

const title = "Manage Products — Mayor Beauty Place";
const description = "Create, edit and publish the Mayor Beauty Place product catalogue.";

export const Route = createFileRoute("/admin/products")({
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
  component: ProductsPage,
});

type FormState = {
  name: string;
  slug: string;
  category: string;
  short_description: string;
  description: string;
  price: string;
  sale_price: string;
  sku: string;
  stock_quantity: string;
  image_url: string;
  gallery_images: string;
  featured: boolean;
  active: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  category: "",
  short_description: "",
  description: "",
  price: "0",
  sale_price: "",
  sku: "",
  stock_quantity: "0",
  image_url: "",
  gallery_images: "",
  featured: false,
  active: true,
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toForm(p: Product): FormState {
  return {
    name: p.name,
    slug: p.slug,
    category: p.category ?? "",
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    price: String(p.price ?? "0"),
    sale_price: p.sale_price == null ? "" : String(p.sale_price),
    sku: p.sku ?? "",
    stock_quantity: String(p.stock_quantity ?? 0),
    image_url: p.image_url ?? "",
    gallery_images: (p.gallery_images ?? []).join("\n"),
    featured: p.featured,
    active: p.active,
  };
}

function toPayload(f: FormState) {
  return {
    name: f.name.trim(),
    slug: (f.slug.trim() || slugify(f.name)).toLowerCase(),
    category: f.category.trim() || null,
    short_description: f.short_description.trim() || null,
    description: f.description.trim() || null,
    price: Number(f.price || 0),
    sale_price: f.sale_price.trim() === "" ? null : Number(f.sale_price),
    sku: f.sku.trim() || null,
    stock_quantity: Number(f.stock_quantity || 0),
    image_url: f.image_url.trim() || null,
    gallery_images: f.gallery_images
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    featured: f.featured,
    active: f.active,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";

function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [search, category, status]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", query],
    queryFn: () => adminApi.products(query),
    retry: false,
  });

  const products = data?.products ?? [];
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])),
    [products],
  );

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    qc.invalidateQueries({ queryKey: ["shop", "products"] });
  }

  const save = useMutation({
    mutationFn: (f: FormState) =>
      editing
        ? adminApi.updateProduct(editing.id, toPayload(f))
        : adminApi.createProduct(toPayload(f)),
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      setForm(null);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: (p: Product) =>
      adminApi.updateProduct(p.id, { ...toPayload(toForm(p)), active: !p.active }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: (p: Product) =>
      adminApi.updateProduct(p.id, { ...toPayload(toForm(p)), featured: !p.featured }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell title="Products" description="Everything on the public shop page">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className={`${inputCls} pl-10`}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${inputCls} w-auto`}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-on-dark transition-colors hover:bg-brand-blue"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs tracking-widest text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Featured</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-11 w-11 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-secondary" />
                    )}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{p.category ?? "—"}</td>
                <td className="px-5 py-4">£{Number(p.price).toFixed(2)}</td>
                <td className="px-5 py-4">{p.stock_quantity}</td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => toggleActive.mutate(p)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.active
                        ? "bg-brand-blue/10 text-brand-blue"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => toggleFeatured.mutate(p)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.featured
                        ? "bg-brand-red/10 text-brand-red"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.featured ? "Featured" : "Standard"}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => {
                        setEditing(p);
                        setForm(toForm(p));
                      }}
                      className="rounded-lg border border-border p-2 hover:bg-secondary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"? This cannot be undone.`))
                          remove.mutate(p.id);
                      }}
                      className="rounded-lg border border-border p-2 text-brand-red hover:bg-brand-red/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 md:p-10">
          <div className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-lift md:p-8">
            <h2 className="font-display text-2xl">
              {editing ? "Edit product" : "Add product"}
            </h2>
            <form
              className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(form);
              }}
            >
              <Field label="Name">
                <input
                  required
                  className={inputCls}
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: editing ? form.slug : slugify(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Slug">
                <input
                  required
                  className={inputCls}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </Field>
              <Field label="Category">
                <input
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </Field>
              <Field label="SKU">
                <input
                  className={inputCls}
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </Field>
              <Field label="Price (£)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
              <Field label="Sale price (£)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={form.sale_price}
                  onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                />
              </Field>
              <Field label="Stock quantity">
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Main image">
                  <div className="space-y-3">
                    <ImageUpload
                      value={form.image_url}
                      onChange={(url) => setForm({ ...form, image_url: url })}
                    />
                    <input
                      className={inputCls}
                      placeholder="…or paste an image URL"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Short description">
                  <input
                    className={inputCls}
                    value={form.short_description}
                    onChange={(e) =>
                      setForm({ ...form, short_description: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={4}
                    className={inputCls}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Gallery images (one URL per line)">
                  <div className="space-y-3">
                    <ImageUpload
                      value=""
                      label="Add gallery image"
                      onChange={(url) =>
                        setForm((f) =>
                          f
                            ? {
                                ...f,
                                gallery_images: [
                                  ...f.gallery_images.split("\n").filter(Boolean),
                                  url,
                                ].join("\n"),
                              }
                            : f,
                        )
                      }
                    />
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={form.gallery_images}
                      onChange={(e) => setForm({ ...form, gallery_images: e.target.value })}
                    />
                  </div>
                </Field>
              </div>
              <div className="flex items-center gap-6 md:col-span-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Active
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured
                </label>
              </div>
              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm(null);
                    setEditing(null);
                  }}
                  className="rounded-full border border-border px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-on-dark hover:bg-brand-blue disabled:opacity-60"
                >
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
