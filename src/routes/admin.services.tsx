import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookingApi, type Service, type ServiceCategory } from "@/lib/admin-api";

const title = "Services — Mayor Beauty Place Admin";
const description = "Manage booking categories, services, prices and durations.";

export const Route = createFileRoute("/admin/services")({
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

type CategoryForm = {
  id?: string;
  name: string;
  description: string;
  sort_order: string;
  active: boolean;
};

type ServiceForm = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  note: string;
  price: string;
  duration_minutes: string;
  sort_order: string;
  active: boolean;
};

const emptyCategory: CategoryForm = {
  name: "",
  description: "",
  sort_order: "0",
  active: true,
};

const inputClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm";

function Page() {
  const qc = useQueryClient();
  const [categoryForm, setCategoryForm] = useState<CategoryForm | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const categoriesQuery = useQuery({
    queryKey: ["admin", "service-categories"],
    queryFn: bookingApi.categories,
  });
  const servicesQuery = useQuery({
    queryKey: ["admin", "services"],
    queryFn: bookingApi.services,
  });

  const categories = categoriesQuery.data?.categories ?? [];
  const services = servicesQuery.data?.services ?? [];
  const currentCategory = activeCategory || categories[0]?.id || "";

  const filtered = useMemo(
    () => services.filter((s) => s.category_id === currentCategory),
    [services, currentCategory],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "service-categories"] });
    qc.invalidateQueries({ queryKey: ["admin", "services"] });
  };

  const saveCategory = useMutation({
    mutationFn: (f: CategoryForm) => {
      const body = {
        name: f.name.trim(),
        description: f.description.trim() || null,
        sort_order: Number(f.sort_order) || 0,
        active: f.active,
      };
      return f.id ? bookingApi.updateCategory(f.id, body) : bookingApi.createCategory(body);
    },
    onSuccess: () => {
      toast.success("Category saved");
      setCategoryForm(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => bookingApi.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      setActiveCategory("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveService = useMutation({
    mutationFn: (f: ServiceForm) => {
      const body = {
        category_id: f.category_id,
        name: f.name.trim(),
        description: f.description.trim() || null,
        note: f.note.trim() || null,
        price: Number(f.price) || 0,
        duration_minutes: Number(f.duration_minutes) || 60,
        sort_order: Number(f.sort_order) || 0,
        active: f.active,
      };
      return f.id ? bookingApi.updateService(f.id, body) : bookingApi.createService(body);
    },
    onSuccess: () => {
      toast.success("Service saved");
      setServiceForm(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteService = useMutation({
    mutationFn: (id: string) => bookingApi.deleteService(id),
    onSuccess: () => {
      toast.success("Service deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleService = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      bookingApi.setServiceActive(id, active),
    onSuccess: (_data, vars) => {
      toast.success(vars.active ? "Service switched on" : "Service switched off");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toCategoryForm = (c: ServiceCategory): CategoryForm => ({
    id: c.id,
    name: c.name,
    description: c.description ?? "",
    sort_order: String(c.sort_order ?? 0),
    active: c.active,
  });

  const toServiceForm = (s: Service): ServiceForm => ({
    id: s.id,
    category_id: s.category_id,
    name: s.name,
    description: s.description ?? "",
    note: s.note ?? "",
    price: String(Number(s.price ?? 0)),
    duration_minutes: String(s.duration_minutes ?? 60),
    sort_order: String(s.sort_order ?? 0),
    active: s.active,
  });

  const loading = categoriesQuery.isLoading || servicesQuery.isLoading;

  return (
    <AdminShell title="Services" description={description}>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">Categories</h2>
              <Button
                size="sm"
                onClick={() => setCategoryForm({ ...emptyCategory })}
                className="rounded-full"
              >
                <Plus className="mr-1 h-4 w-4" /> New
              </Button>
            </div>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                    currentCategory === c.id
                      ? "border-brand-blue bg-secondary"
                      : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      #{c.sort_order} · {c.service_count ?? 0} services{" "}
                      {c.active ? "" : "· inactive"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryForm(toCategoryForm(c))}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-background"
                    aria-label="Edit category"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${c.name}" and all its services?`))
                        deleteCategory.mutate(c.id);
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-brand-red"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">
                {categories.find((c) => c.id === currentCategory)?.name ?? "Services"}
              </h2>
              <Button
                size="sm"
                disabled={!currentCategory}
                onClick={() =>
                  setServiceForm({
                    category_id: currentCategory,
                    name: "",
                    description: "",
                    note: "",
                    price: "0",
                    duration_minutes: "60",
                    sort_order: String(filtered.length),
                    active: true,
                  })
                }
                className="rounded-full"
              >
                <Plus className="mr-1 h-4 w-4" /> New service
              </Button>
            </div>

            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No services in this category yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-2 font-medium">
                          {s.name}
                          {s.note ? (
                            <span
                              title={s.note}
                              className="mt-0.5 block max-w-[220px] truncate text-xs font-normal text-muted-foreground"
                            >
                              Note: {s.note}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">£{Number(s.price ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2">{s.duration_minutes} min</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={s.active}
                            aria-label={`${s.active ? "Switch off" : "Switch on"} ${s.name}`}
                            disabled={toggleService.isPending}
                            onClick={() =>
                              toggleService.mutate({ id: s.id, active: !s.active })
                            }
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              className={`relative h-5 w-9 rounded-full transition-colors ${
                                s.active ? "bg-brand-blue" : "bg-muted"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-soft transition-all ${
                                  s.active ? "left-4.5" : "left-0.5"
                                }`}
                              />
                            </span>
                            <span
                              className={
                                s.active ? "text-brand-blue" : "text-muted-foreground"
                              }
                            >
                              {s.active ? "On" : "Off"}
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setServiceForm(toServiceForm(s))}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                            aria-label="Edit service"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete "${s.name}"?`)) deleteService.mutate(s.id);
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-brand-red"
                            aria-label="Delete service"
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
          </section>
        </div>
      )}

      {categoryForm && (
        <Modal title={categoryForm.id ? "Edit category" : "New category"} onClose={() => setCategoryForm(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, description: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Display order</Label>
                <Input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, sort_order: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={categoryForm.active}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, active: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
            <Button
              className="w-full rounded-full"
              disabled={saveCategory.isPending || !categoryForm.name.trim()}
              onClick={() => saveCategory.mutate(categoryForm)}
            >
              {saveCategory.isPending ? "Saving…" : "Save category"}
            </Button>
          </div>
        </Modal>
      )}

      {serviceForm && (
        <Modal title={serviceForm.id ? "Edit service" : "New service"} onClose={() => setServiceForm(null)}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={serviceForm.category_id}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, category_id: e.target.value })
                }
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, description: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Internal note (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Only visible to you in the admin area"
                value={serviceForm.note}
                onChange={(e) => setServiceForm({ ...serviceForm, note: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price (£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, duration_minutes: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={serviceForm.active}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, active: e.target.checked })
                }
              />
              Active
            </label>
            <Button
              className="w-full rounded-full"
              disabled={saveService.isPending || !serviceForm.name.trim()}
              onClick={() => saveService.mutate(serviceForm)}
            >
              {saveService.isPending ? "Saving…" : "Save service"}
            </Button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

function Modal({
  title: heading,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl">{heading}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
