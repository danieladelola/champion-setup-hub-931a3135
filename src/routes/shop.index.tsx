import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { publicApi, type Product } from "@/lib/admin-api";
import { formatPrice, unitPriceOf, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { AdSlot } from "@/components/ad-slot";
import { useSettings } from "@/lib/site-settings";

const title = "Shop — Mayor Beauty Place";
const description =
  "Curated professional-grade beauty essentials from Mayor Beauty Place: serums, lipsticks, lash complexes and more, shipped across the UK.";

export const Route = createFileRoute("/shop/")({
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
  component: Shop,
});

function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const navigate = useNavigate();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);
  const price = formatPrice(product.price);
  const sale = formatPrice(product.sale_price);
  const inStock = product.stock_quantity > 0;

  return (
    <article className="group overflow-hidden rounded-3xl bg-card shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift">
      <div className="relative">
        <button
          type="button"
          aria-label={
            saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
          }
          aria-pressed={saved}
          onClick={() => {
            const added = wishlist.toggle({
              product_id: product.id,
              slug: product.slug,
              name: product.name,
              image_url: product.image_url,
              unit_price: unitPriceOf(product),
            });
            toast.success(
              added
                ? `${product.name} saved to your wishlist`
                : `${product.name} removed from your wishlist`,
            );
          }}
          className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-soft backdrop-blur transition-colors hover:text-brand-red"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-brand-red text-brand-red" : ""}`} />
        </button>
        <Link
          to="/shop/$slug"
          params={{ slug: product.slug }}
          className="block aspect-[4/5] overflow-hidden bg-secondary"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              width={800}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs tracking-widest text-muted-foreground uppercase">
              No image
            </div>
          )}
        </Link>
      </div>
      <div className="p-6">
        <div className="text-[10px] tracking-widest text-brand-blue uppercase">
          {product.category ?? "Beauty"}
        </div>
        <h2 className="mt-2 font-display text-2xl">
          <Link to="/shop/$slug" params={{ slug: product.slug }} className="hover:text-brand-red">
            {product.name}
          </Link>
        </h2>
        {product.short_description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {product.short_description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="font-display text-2xl text-brand-red">
            {sale ?? price}
            {sale && price && (
              <span className="ml-2 align-middle text-sm text-muted-foreground line-through">
                {price}
              </span>
            )}
          </p>
          <button
            type="button"
            disabled={!inStock}
            onClick={() => {
              cart.add(
                {
                  product_id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image_url: product.image_url,
                  unit_price: unitPriceOf(product),
                },
                1,
              );
              navigate({ to: "/checkout" });
            }}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-on-dark transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {inStock ? "Add to Bag" : "Sold out"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
      <div className="aspect-[4/5] animate-pulse bg-secondary" />
      <div className="space-y-3 p-6">
        <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-6 w-24 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}

function Shop() {
  const settings = useSettings();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => publicApi.products(),
  });
  const products = data?.products ?? [];

  if (!settings.shop.enabled) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6 py-32">
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <h1 className="font-display text-3xl">Shop unavailable</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {settings.shop.disabled_message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-ink px-6 pt-32 pb-16 text-center text-on-dark md:px-12 md:pt-40 md:pb-24">
        <img
          src="/images/shop-hero.png"
          alt="Vibrant red hair beauty portrait in a luxury salon setting"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-on-dark/25 bg-on-dark/10 px-5 py-2 text-xs font-medium tracking-widest text-on-dark/90 uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
            Shop
          </span>
          <h1 className="animate-reveal font-display text-5xl leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl">
            The <em className="italic text-brand-red">Selection</em>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed font-light text-on-dark/90">
            Only the world's most effective and sustainable beauty formulas — the same products we
            trust in the salon.
          </p>
        </div>
      </section>
      <AdSlot placement="shop_top" />

      <section className="px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <p className="text-center text-sm text-muted-foreground">
              We couldn't load the shop right now. Please refresh and try again.
            </p>
          ) : products.length === 0 ? (
            <div className="mx-auto max-w-md text-center">
              <h2 className="font-display text-3xl">No products are currently available.</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Please check back soon or get in touch and we'll let you know the moment products
                are back.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
      <AdSlot placement="shop_bottom" />
    </main>
  );
}
