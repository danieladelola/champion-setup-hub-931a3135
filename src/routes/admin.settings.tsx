import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { BlockedDatesManager } from "@/components/admin/blocked-dates-manager";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CURRENCIES,
  DEFAULT_SETTINGS,
  normaliseOpenDays,
  TIMEZONES,
  WEEKDAYS,
  type SiteSettings,
} from "@/lib/settings";

const title = "Settings — Mayor Beauty Place Admin";
const description = "Configure branding, contact details, booking, shop and SEO defaults.";

export const Route = createFileRoute("/admin/settings")({
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

type Group = keyof SiteSettings;

/** Small helpers so each field stays a one-liner below. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs tracking-wide text-muted-foreground uppercase">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string | undefined;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const res = await adminApi.upload(file);
      onChange(res.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {value ? (
          <span className="relative flex h-16 w-full max-w-[10rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
            <img src={value} alt="" className="h-full w-full object-contain" />
          </span>
        ) : null}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/api/media/... or https://..."
            className="min-w-[12rem] flex-1"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="ml-2">Upload</span>
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </Field>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="font-display text-lg">{title}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-brand-blue";

function Page() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminApi.settings,
  });

  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings);
      setDirty(false);
    }
  }, [data]);

  function set<G extends Group>(group: G, key: keyof SiteSettings[G], value: unknown) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  }

  const save = useMutation({
    mutationFn: () => adminApi.updateSettings(form),
    onSuccess: (res) => {
      setForm(res.settings);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved. The website has been updated.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save settings"),
  });

  if (isLoading) {
    return (
      <AdminShell title="Settings" description={description}>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
        </div>
      </AdminShell>
    );
  }

  if (isError) {
    return (
      <AdminShell title="Settings" description={description}>
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Settings could not be loaded. Check that the database is reachable and reload the page.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Settings" description={description}>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {dirty ? "You have unsaved changes." : "Everything is saved."}
          </p>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-2">Save changes</span>
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="frontend">Frontend</TabsTrigger>
            <TabsTrigger value="contact">Contact &amp; Social</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="shop">Shop / Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* GENERAL */}
          <TabsContent value="general" className="mt-5 space-y-6">
            <Section title="Website identity">
              <Field label="Website name">
                <Input
                  value={form.general.site_name}
                  onChange={(e) => set("general", "site_name", e.target.value)}
                />
              </Field>
              <Field label="Tagline">
                <Input
                  value={form.general.tagline}
                  onChange={(e) => set("general", "tagline", e.target.value)}
                />
              </Field>
              <ImageField
                label="Logo"
                hint="Shown in the header and footer. A wide transparent PNG works best."
                value={form.general.logo_url}
                onChange={(v) => set("general", "logo_url", v)}
              />
              <ImageField
                label="Favicon"
                hint="Small square icon shown in the browser tab."
                value={form.general.favicon_url}
                onChange={(v) => set("general", "favicon_url", v)}
              />
              <Field label="Currency" hint="Used for all prices across the website.">
                <select
                  className={selectClass}
                  value={form.general.currency_code}
                  onChange={(e) => set("general", "currency_code", e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone" hint="Used when showing booking dates and times.">
                <select
                  className={selectClass}
                  value={form.general.timezone}
                  onChange={(e) => set("general", "timezone", e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </Field>
            </Section>
          </TabsContent>

          {/* FRONTEND */}
          <TabsContent value="frontend" className="mt-5 space-y-6">
            <Section title="Announcement bar">
              <div className="md:col-span-2">
                <ToggleRow
                  label="Show announcement bar"
                  hint="A thin banner at the very top of every page."
                  checked={form.announcement.enabled}
                  onChange={(v) => set("announcement", "enabled", v)}
                />
              </div>
              <Field label="Announcement text">
                <Input
                  value={form.announcement.text}
                  onChange={(e) => set("announcement", "text", e.target.value)}
                  placeholder="Free delivery this week only"
                />
              </Field>
              <Field label="Link label">
                <Input
                  value={form.announcement.link_label}
                  onChange={(e) => set("announcement", "link_label", e.target.value)}
                  placeholder="Shop now"
                />
              </Field>
              <Field label="Link URL">
                <Input
                  value={form.announcement.link_url}
                  onChange={(e) => set("announcement", "link_url", e.target.value)}
                  placeholder="/shop"
                />
              </Field>
            </Section>

            <Section title="Homepage hero">
              <Field label="Small badge text">
                <Input
                  value={form.home.hero_badge}
                  onChange={(e) => set("home", "hero_badge", e.target.value)}
                />
              </Field>
              <Field label="Heading">
                <Input
                  value={form.home.hero_title}
                  onChange={(e) => set("home", "hero_title", e.target.value)}
                />
              </Field>
              <Field label="Heading highlight" hint="Shown in italic red under the heading.">
                <Input
                  value={form.home.hero_title_accent}
                  onChange={(e) => set("home", "hero_title_accent", e.target.value)}
                />
              </Field>
              <ImageField
                label="Hero image"
                hint="Leave empty to keep the built-in image."
                value={form.home.hero_image_url}
                onChange={(v) => set("home", "hero_image_url", v)}
              />
              <div className="md:col-span-2">
                <Field label="Intro paragraph">
                  <Textarea
                    rows={3}
                    value={form.home.hero_subtitle}
                    onChange={(e) => set("home", "hero_subtitle", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Main button label">
                <Input
                  value={form.home.primary_cta_label}
                  onChange={(e) => set("home", "primary_cta_label", e.target.value)}
                />
              </Field>
              <Field label="Main button link" hint="An internal path such as /book.">
                <Input
                  value={form.home.primary_cta_url}
                  onChange={(e) => set("home", "primary_cta_url", e.target.value)}
                />
              </Field>
              <Field label="Second button label">
                <Input
                  value={form.home.secondary_cta_label}
                  onChange={(e) => set("home", "secondary_cta_label", e.target.value)}
                />
              </Field>
              <Field label="Second button link">
                <Input
                  value={form.home.secondary_cta_url}
                  onChange={(e) => set("home", "secondary_cta_url", e.target.value)}
                />
              </Field>
            </Section>

            <Section title="Homepage sections">
              <ToggleRow
                label="About section"
                checked={form.home.show_about}
                onChange={(v) => set("home", "show_about", v)}
              />
              <ToggleRow
                label="What we stand for"
                checked={form.home.show_pillars}
                onChange={(v) => set("home", "show_pillars", v)}
              />
              <ToggleRow
                label="How we work"
                checked={form.home.show_steps}
                onChange={(v) => set("home", "show_steps", v)}
              />
              <ToggleRow
                label="Video"
                checked={form.home.show_video}
                onChange={(v) => set("home", "show_video", v)}
              />
              <ToggleRow
                label="Featured products"
                checked={form.home.show_shop_teaser}
                onChange={(v) => set("home", "show_shop_teaser", v)}
              />
              <ToggleRow
                label="Testimonials"
                checked={form.home.show_testimonials}
                onChange={(v) => set("home", "show_testimonials", v)}
              />
              <Field label="Number of featured products" hint="Between 2 and 12.">
                <Input
                  type="number"
                  min={2}
                  max={12}
                  value={form.home.shop_teaser_count}
                  onChange={(e) => set("home", "shop_teaser_count", Number(e.target.value))}
                />
              </Field>
            </Section>

            <Section title="Footer">
              <div className="md:col-span-2">
                <Field label="Footer text">
                  <Textarea
                    rows={3}
                    value={form.footer.about_text}
                    onChange={(e) => set("footer", "about_text", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Copyright line" hint="Use {year} to insert the current year.">
                <Input
                  value={form.footer.copyright}
                  onChange={(e) => set("footer", "copyright", e.target.value)}
                />
              </Field>
              <div className="grid gap-3">
                <ToggleRow
                  label="Show social links"
                  checked={form.footer.show_socials}
                  onChange={(v) => set("footer", "show_socials", v)}
                />
                <ToggleRow
                  label="Show payment methods"
                  checked={form.footer.show_payment_methods}
                  onChange={(v) => set("footer", "show_payment_methods", v)}
                />
              </div>
            </Section>
          </TabsContent>

          {/* CONTACT & SOCIAL */}
          <TabsContent value="contact" className="mt-5 space-y-6">
            <Section title="Contact details">
              <Field label="Contact email">
                <Input
                  value={form.contact.email}
                  onChange={(e) => set("contact", "email", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={form.contact.phone}
                  onChange={(e) => set("contact", "phone", e.target.value)}
                />
              </Field>
              <Field label="Second phone">
                <Input
                  value={form.contact.phone_alt}
                  onChange={(e) => set("contact", "phone_alt", e.target.value)}
                />
              </Field>
              <Field label="WhatsApp number">
                <Input
                  value={form.contact.whatsapp}
                  onChange={(e) => set("contact", "whatsapp", e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Address" hint="One line per row.">
                  <Textarea
                    rows={3}
                    value={form.contact.address}
                    onChange={(e) => set("contact", "address", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Opening hours">
                <Input
                  value={form.contact.opening_hours}
                  onChange={(e) => set("contact", "opening_hours", e.target.value)}
                />
              </Field>
              <Field label="Reply time note">
                <Input
                  value={form.contact.response_time_note}
                  onChange={(e) => set("contact", "response_time_note", e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Map embed URL">
                  <Input
                    value={form.contact.map_embed_url}
                    onChange={(e) => set("contact", "map_embed_url", e.target.value)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <ToggleRow
                  label="Show map on the contact page"
                  checked={form.contact.show_map}
                  onChange={(v) => set("contact", "show_map", v)}
                />
              </div>
            </Section>

            <Section title="Social links">
              {(
                [
                  ["instagram", "Instagram"],
                  ["facebook", "Facebook"],
                  ["tiktok", "TikTok"],
                  ["youtube", "YouTube"],
                  ["x", "X (Twitter)"],
                  ["linkedin", "LinkedIn"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <Input
                    value={form.social[key]}
                    onChange={(e) => set("social", key, e.target.value)}
                    placeholder="https://"
                  />
                </Field>
              ))}
            </Section>
          </TabsContent>

          {/* BOOKING */}
          <TabsContent value="booking" className="mt-5 space-y-6">
            <Section title="Online booking">
              <div className="md:col-span-2">
                <ToggleRow
                  label="Accept online bookings"
                  hint="Turn off to close the booking page with a message."
                  checked={form.booking.enabled}
                  onChange={(v) => set("booking", "enabled", v)}
                />
              </div>
              <div className="md:col-span-2">
                <Field label="Message when booking is closed">
                  <Textarea
                    rows={2}
                    value={form.booking.disabled_message}
                    onChange={(e) => set("booking", "disabled_message", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Opening time">
                <Input
                  type="time"
                  value={form.booking.open_time}
                  onChange={(e) => set("booking", "open_time", e.target.value)}
                />
              </Field>
              <Field label="Closing time">
                <Input
                  type="time"
                  value={form.booking.close_time}
                  onChange={(e) => set("booking", "close_time", e.target.value)}
                />
              </Field>
              <Field label="Minutes between time slots" hint="Between 5 and 120.">
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={form.booking.slot_interval_minutes}
                  onChange={(e) =>
                    set("booking", "slot_interval_minutes", Number(e.target.value))
                  }
                />
              </Field>
              <div className="md:col-span-2">
                <Field
                  label="Days we take bookings"
                  hint="Switch a day off and it cannot be selected on the booking calendar."
                >
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day, i) => {
                      const days = normaliseOpenDays(form.booking.open_days);
                      const open = days[i] === true;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const next = [...days];
                            next[i] = !open;
                            set("booking", "open_days", next);
                          }}
                          aria-pressed={open}
                          className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                            open
                              ? "border-brand-blue bg-brand-blue text-white"
                              : "border-border bg-card text-muted-foreground line-through"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
              <Field label="Minimum notice (hours)">
                <Input
                  type="number"
                  min={0}
                  max={720}
                  value={form.booking.min_notice_hours}
                  onChange={(e) => set("booking", "min_notice_hours", Number(e.target.value))}
                />
              </Field>
              <Field label="How far ahead people can book (days)">
                <Input
                  type="number"
                  min={1}
                  max={730}
                  value={form.booking.max_advance_days}
                  onChange={(e) => set("booking", "max_advance_days", Number(e.target.value))}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Note shown on the booking page">
                  <Textarea
                    rows={2}
                    value={form.booking.note}
                    onChange={(e) => set("booking", "note", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Blocked dates &amp; closures">
              <div className="md:col-span-2">
                <BlockedDatesManager />
              </div>
            </Section>
          </TabsContent>

          {/* SHOP */}
          <TabsContent value="shop" className="mt-5 space-y-6">
            <Section title="Shop &amp; orders">
              <div className="md:col-span-2">
                <ToggleRow
                  label="Shop open"
                  hint="Turn off to hide the shop and show a notice instead."
                  checked={form.shop.enabled}
                  onChange={(v) => set("shop", "enabled", v)}
                />
              </div>
              <div className="md:col-span-2">
                <Field label="Message when the shop is closed">
                  <Textarea
                    rows={2}
                    value={form.shop.disabled_message}
                    onChange={(e) => set("shop", "disabled_message", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Delivery charge" hint="Set 0 for free delivery on all orders.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.shop.shipping_flat_rate}
                  onChange={(e) => set("shop", "shipping_flat_rate", Number(e.target.value))}
                />
              </Field>
              <Field
                label="Free delivery over"
                hint="Orders at or above this amount get free delivery. 0 disables this."
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.shop.free_shipping_threshold}
                  onChange={(e) => set("shop", "free_shipping_threshold", Number(e.target.value))}
                />
              </Field>
              <Field label="Low stock warning at">
                <Input
                  type="number"
                  min={0}
                  value={form.shop.low_stock_threshold}
                  onChange={(e) => set("shop", "low_stock_threshold", Number(e.target.value))}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Note shown with orders">
                  <Textarea
                    rows={2}
                    value={form.shop.order_note}
                    onChange={(e) => set("shop", "order_note", e.target.value)}
                  />
                </Field>
              </div>
            </Section>
          </TabsContent>

          {/* PAYMENTS */}
          <TabsContent value="payments" className="mt-5 space-y-6">
            <Section title="Payment display">
              <div className="md:col-span-2 grid gap-3">
                <ToggleRow
                  label="Card payments available"
                  hint="Turn off if you are only taking payment in the salon."
                  checked={form.payments.card_payments_enabled}
                  onChange={(v) => set("payments", "card_payments_enabled", v)}
                />
                <ToggleRow
                  label="Show secure payment badge"
                  checked={form.payments.show_secure_badge}
                  onChange={(v) => set("payments", "show_secure_badge", v)}
                />
              </div>
              <Field label="Accepted payment methods text">
                <Input
                  value={form.payments.accepted_methods_note}
                  onChange={(e) => set("payments", "accepted_methods_note", e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Checkout note">
                  <Textarea
                    rows={2}
                    value={form.payments.checkout_note}
                    onChange={(e) => set("payments", "checkout_note", e.target.value)}
                  />
                </Field>
              </div>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Payment keys are stored securely outside these settings and are never shown here.
              </p>
            </Section>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo" className="mt-5 space-y-6">
            <Section title="Search engines &amp; sharing">
              <Field label="Default page title" hint="Up to 70 characters.">
                <Input
                  value={form.seo.meta_title}
                  onChange={(e) => set("seo", "meta_title", e.target.value)}
                />
              </Field>
              <ImageField
                label="Sharing image"
                hint="Used when your pages are shared on social media."
                value={form.seo.og_image_url}
                onChange={(v) => set("seo", "og_image_url", v)}
              />
              <div className="md:col-span-2">
                <Field label="Default description" hint="Up to 200 characters.">
                  <Textarea
                    rows={3}
                    value={form.seo.meta_description}
                    onChange={(e) => set("seo", "meta_description", e.target.value)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <ToggleRow
                  label="Allow search engines to index the website"
                  checked={form.seo.allow_indexing}
                  onChange={(v) => set("seo", "allow_indexing", v)}
                />
              </div>
            </Section>
          </TabsContent>

          {/* SYSTEM */}
          <TabsContent value="system" className="mt-5 space-y-6">
            <Section title="Maintenance mode">
              <div className="md:col-span-2">
                <ToggleRow
                  label="Maintenance mode"
                  hint="Visitors see a holding message. The admin panel keeps working."
                  checked={form.system.maintenance_mode}
                  onChange={(v) => set("system", "maintenance_mode", v)}
                />
              </div>
              <div className="md:col-span-2">
                <Field label="Maintenance message">
                  <Textarea
                    rows={3}
                    value={form.system.maintenance_message}
                    onChange={(e) => set("system", "maintenance_message", e.target.value)}
                  />
                </Field>
              </div>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
