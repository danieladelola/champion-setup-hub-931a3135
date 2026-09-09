import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatPrice, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

const title = "Wishlist — Mayor Beauty Place";
const description =
  "Your saved Mayor Beauty Place products — keep track of the beauty essentials you love and add them to your bag when you're ready.";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const wishlist = useWishlist();
  const cart = useCart();

  return (
    <main className="min-h-screen bg-card px-5 pt-32 pb-28 md:px-10 md:pt-44 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-[11px] tracking-widest text-brand-red uppercase">Saved for later</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">My Wishlist</h1>

        {!wishlist.hydrated ? null : wishlist.items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-border/70 bg-background/60 p-12 text-center">
            <Heart className="mx-auto h-8 w-8 text-brand-red" />
            <h2 className="mt-4 font-display text-2xl">Nothing saved yet</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Tap the heart on any product to keep it here for later.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-xs font-semibold tracking-widest text-on-dark uppercase transition-colors hover:bg-brand-blue"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-border/70 border-y border-border/70">
            {wishlist.items.map((item) => (
              <li key={item.product_id} className="flex items-center gap-5 py-6">
                <Link
                  to="/shop/$slug"
                  params={{ slug: item.slug }}
                  className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      width={160}
                      height={200}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/shop/$slug"
                    params={{ slug: item.slug }}
                    className="font-display text-xl hover:text-brand-red"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 font-display text-lg text-brand-red">
                    {formatPrice(item.unit_price)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      cart.add(
                        {
                          product_id: item.product_id,
                          slug: item.slug,
                          name: item.name,
                          image_url: item.image_url,
                          unit_price: item.unit_price,
                        },
                        1,
                      );
                      toast.success(`${item.name} added to your bag`);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-on-dark transition-colors hover:bg-brand-blue"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to Bag
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name} from wishlist`}
                    onClick={() => wishlist.remove(item.product_id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:text-brand-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
