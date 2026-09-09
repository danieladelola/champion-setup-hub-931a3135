import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, Minus, Plus, RotateCcw, ShoppingBag, Trash2, Truck } from "lucide-react";

import { formatPrice, useCart } from "@/lib/cart";
import { AdSlot } from "@/components/ad-slot";

const title = "Your Cart — Mayor Beauty Place";
const description = "Review the beauty products in your Mayor Beauty Place bag before checkout.";

export const Route = createFileRoute("/cart")({
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
  component: CartPage,
});

const PERKS = [
  { icon: Truck, label: "Free UK delivery", note: "On every order, always" },
  { icon: Lock, label: "Secure payment", note: "Card & Klarna via Stripe" },
  { icon: RotateCcw, label: "Easy returns", note: "14 days to change your mind" },
];

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const empty = cart.hydrated && cart.items.length === 0;

  return (
    <main className="px-6 pt-40 pb-24 md:px-12 md:pt-52">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="text-[0.7rem] tracking-[0.35em] text-muted-foreground uppercase">
              Step 1 of 2
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">Your Cart</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {cart.hydrated
              ? `${cart.count} item${cart.count === 1 ? "" : "s"} in your bag`
              : "Loading your bag…"}
          </p>
        </header>

        {!cart.hydrated ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-3xl bg-secondary" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
          </div>
        ) : empty ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </span>
            <h2 className="mt-6 font-display text-3xl">Your bag is empty</h2>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Nothing here yet. Explore our wigs, skincare and beauty essentials to get started.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xs font-semibold tracking-widest text-on-dark uppercase transition hover:bg-brand-blue"
            >
              Browse the shop <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.6fr_1fr]">
            <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
              {cart.items.map((item) => (
                <li key={item.product_id} className="flex flex-wrap items-center gap-5 p-5 md:p-6">
                  <Link
                    to="/shop/$slug"
                    params={{ slug: item.slug }}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        width={192}
                        height={192}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : null}
                  </Link>

                  <div className="min-w-40 flex-1">
                    <Link
                      to="/shop/$slug"
                      params={{ slug: item.slug }}
                      className="font-display text-xl leading-tight transition hover:text-brand-red"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} each
                    </p>
                    <button
                      type="button"
                      onClick={() => cart.remove(item.product_id)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-brand-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="inline-flex items-center rounded-full border border-border bg-background">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => cart.setQuantity(item.product_id, item.quantity - 1)}
                      className="rounded-l-full p-3 transition hover:bg-secondary"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => cart.setQuantity(item.product_id, item.quantity + 1)}
                      className="rounded-r-full p-3 transition hover:bg-secondary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="w-24 text-right font-display text-2xl">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <aside className="space-y-5 lg:sticky lg:top-32">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-2xl">Order Summary</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd>{formatPrice(cart.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="font-semibold text-brand-blue">Free</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <dt className="text-xs tracking-widest uppercase">Total</dt>
                    <dd className="font-display text-3xl text-brand-red">
                      {formatPrice(cart.subtotal)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => navigate({ to: "/checkout" })}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-xs font-semibold tracking-widest text-on-dark uppercase transition hover:bg-brand-blue"
                >
                  Proceed to Checkout <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <Link
                  to="/shop"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-ink px-6 py-3.5 text-xs font-semibold tracking-widest uppercase transition hover:bg-secondary"
                >
                  Continue Shopping
                </Link>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Secure checkout powered by Stripe
                </p>
              </div>

              <ul className="grid gap-3 rounded-3xl border border-border bg-secondary/60 p-6">
                {PERKS.map((perk) => (
                  <li key={perk.label} className="flex items-start gap-3">
                    <perk.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                    <div>
                      <p className="text-sm font-semibold">{perk.label}</p>
                      <p className="text-xs text-muted-foreground">{perk.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </div>
      <AdSlot placement="cart" />
    </main>
  );
}
