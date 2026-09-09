import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { publicApi } from "@/lib/admin-api";
import { useSettings } from "@/lib/site-settings";
import { calculateDeliveryFee } from "@/lib/shipping";
import { formatPrice, useCart } from "@/lib/cart";
import { AdSlot } from "@/components/ad-slot";

const title = "Checkout — Mayor Beauty Place";
const description = "Complete your Mayor Beauty Place order with secure delivery details.";

export const Route = createFileRoute("/checkout")({
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
  component: CheckoutPage,
});

type Field = {
  name: string;
  label: string;
  type: string;
  required: boolean;
  full?: boolean;
  placeholder?: string;
  autoComplete?: string;
};

const CONTACT_FIELDS: Field[] = [
  { name: "first_name", label: "First Name", type: "text", required: true, autoComplete: "given-name", placeholder: "Ada" },
  { name: "last_name", label: "Last Name", type: "text", required: true, autoComplete: "family-name", placeholder: "Okafor" },
  { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", placeholder: "you@email.com" },
  { name: "phone", label: "Phone Number", type: "tel", required: true, autoComplete: "tel", placeholder: "+44 7000 000000" },
];

const DELIVERY_FIELDS: Field[] = [
  { name: "address", label: "Address", type: "text", required: true, full: true, autoComplete: "street-address", placeholder: "12 Beauty Lane" },
  { name: "city", label: "City", type: "text", required: true, autoComplete: "address-level2", placeholder: "London" },
  { name: "state", label: "State / County", type: "text", required: true, autoComplete: "address-level1", placeholder: "Greater London" },
  { name: "country", label: "Country", type: "text", required: true, full: true, autoComplete: "country-name", placeholder: "United Kingdom" },
];

const FIELDS: Field[] = [...CONTACT_FIELDS, ...DELIVERY_FIELDS];

const PERKS = [
  { icon: Truck, label: "Fast, tracked UK delivery" },
  { icon: RotateCcw, label: "14-day easy returns" },
];

function CheckoutPage() {
  const cart = useCart();
  const settings = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deliveryFee = calculateDeliveryFee(cart.subtotal, {
    flatRate: settings.shop.shipping_flat_rate,
    freeThreshold: settings.shop.free_shipping_threshold,
  });
  const perks = [
    ...PERKS,
    ...(settings.payments.show_secure_badge
      ? [{ icon: ShieldCheck, label: settings.payments.accepted_methods_note }]
      : []),
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (cart.items.length === 0) {
      toast.error("Your cart is empty. Add a product before proceeding to checkout.");
      return;
    }

    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "").trim();
    const values = new Map<string, string>(
      [...FIELDS.map((f) => f.name), "notes"].map((k) => [k as string, get(k)]),
    );
    const v = (key: string) => values.get(key) ?? "";

    const nextErrors: Record<string, string> = {};
    for (const field of FIELDS) {
      if (!v(field.name)) nextErrors[field.name] = `${field.label} is required`;
    }
    if (v("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) {
      nextErrors["email"] = "Enter a valid email address";
    }
    if (v("phone") && v("phone").replace(/\D/g, "").length < 7) {
      nextErrors["phone"] = "Enter a valid phone number";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      // Creates the order in Postgres, then hands off to Stripe Checkout
      // (card + Klarna). The cart is cleared once the redirect is confirmed.
      const res = await publicApi.startCheckout({
        first_name: v("first_name"),
        last_name: v("last_name"),
        email: v("email"),
        phone: v("phone"),
        address: v("address"),
        city: v("city"),
        state: v("state"),
        country: v("country"),
        ...(v("notes") ? { notes: v("notes") } : {}),
        items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      cart.clear();
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "We couldn't start your payment.");
      setSubmitting(false);
    }
  }

  if (cart.hydrated && cart.items.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-40 pb-24 text-center">
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Your cart is empty. Add a product before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-xs font-semibold tracking-widest text-on-dark uppercase transition hover:bg-brand-blue"
        >
          Back to shop
        </Link>
      </main>
    );
  }

  const renderField = (field: Field) => (
    <div key={field.name} className={field.full ? "sm:col-span-2" : undefined}>
      <label
        htmlFor={field.name}
        className="text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase"
      >
        {field.label}
      </label>
      <input
        id={field.name}
        name={field.name}
        type={field.type}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete ?? "on"}
        aria-invalid={errors[field.name] ? true : undefined}
        className={`mt-2 w-full rounded-xl border bg-background px-4 py-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-brand-blue/20 ${
          errors[field.name] ? "border-brand-red" : "border-border focus:border-brand-blue"
        }`}
      />
      {errors[field.name] && <p className="mt-1.5 text-xs text-brand-red">{errors[field.name]}</p>}
    </div>
  );

  return (
    <main className="px-6 pt-40 pb-24 md:px-12 md:pt-52">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="text-[0.7rem] tracking-[0.35em] text-muted-foreground uppercase">
              Step 2 of 2
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">Checkout</h1>
          </div>
          <Link
            to="/cart"
            className="text-xs tracking-widest text-muted-foreground uppercase transition hover:text-brand-red"
          >
            ← Back to cart
          </Link>
        </header>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-on-dark">
                  1
                </span>
                <h2 className="font-display text-2xl">Contact Details</h2>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {CONTACT_FIELDS.map(renderField)}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-on-dark">
                  2
                </span>
                <h2 className="font-display text-2xl">Delivery Address</h2>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {DELIVERY_FIELDS.map(renderField)}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="notes"
                    className="text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    Order Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    placeholder="Delivery instructions, preferred times…"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>
              </div>
            </section>

            {settings.payments.checkout_note ? (
              <p className="rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
                {settings.payments.checkout_note}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-8 py-4.5 text-xs font-semibold tracking-widest text-on-dark uppercase transition hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Redirecting to payment…" : "Continue to Secure Payment"}
              {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-32">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-2xl">Order Summary</h2>
              <ul className="mt-5 space-y-4">
                {cart.items.map((item) => (
                  <li key={item.product_id} className="flex items-center gap-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          width={112}
                          height={112}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[0.65rem] font-semibold text-on-dark">
                        {item.quantity}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} each
                      </span>
                    </span>
                    <span className="text-sm font-semibold">
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatPrice(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery Fee</dt>
                  <dd className="font-semibold text-brand-blue">
                    {deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-border pt-4">
                  <dt className="text-xs tracking-widest uppercase">Total</dt>
                  <dd className="font-display text-3xl text-brand-red">
                    {formatPrice(cart.subtotal + deliveryFee)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Totals are re-verified against our live catalogue.
              </p>
            </div>

            <ul className="grid gap-3 rounded-3xl border border-border bg-secondary/60 p-6">
              {perks.map((perk) => (
                <li key={perk.label} className="flex items-center gap-3 text-sm">
                  <perk.icon className="h-4 w-4 shrink-0 text-brand-blue" />
                  {perk.label}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
      <AdSlot placement="checkout" />
    </main>
  );
}
