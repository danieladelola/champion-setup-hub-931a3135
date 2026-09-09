import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react";
import { toast } from "sonner";

import { publicApi } from "@/lib/admin-api";
import { formatPrice, unitPriceOf, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { AdSlot } from "@/components/ad-slot";

export const Route = createFileRoute("/shop/$slug")({
  head: ({ params }) => {
    const title = "Product — Mayor Beauty Place";
    const description = `Product details for ${params.slug.replace(/-/g, " ")} at Mayor Beauty Place.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/shop/${params.slug}` },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/shop/${params.slug}` }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => publicApi.product(slug),
    retry: false,
  });

  const product = data?.product;
  const status = (error as (Error & { status?: number }) | null)?.status;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-card px-6 pt-40 pb-24 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_1fr]">
          <div className="aspect-4/5 animate-pulse rounded-[2rem] bg-secondary" />
          <div className="space-y-5 pt-6">
            <div className="h-10 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-7 w-1/3 animate-pulse rounded bg-secondary" />
            <div className="h-32 w-full animate-pulse rounded bg-secondary" />
            <div className="h-12 w-1/2 animate-pulse rounded-full bg-secondary" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-card px-6 pt-40 pb-24 text-center">
        <p className="text-xs tracking-widest text-brand-red uppercase">
          {status === 404 ? "404" : "Error"}
        </p>
        <h1 className="mt-3 font-display text-4xl">
          {status === 404 ? "Product not found" : "We couldn't load this product"}
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          {status === 404
            ? "This product is no longer available or the link is incorrect."
            : "Please refresh and try again."}
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-xs font-semibold text-on-dark hover:bg-brand-blue"
        >
          Back to shop
        </Link>
      </main>
    );
  }

  const unit = unitPriceOf(product);
  const inStock = product.stock_quantity > 0;
  const max = Math.max(1, product.stock_quantity);
  const gallery = Array.isArray(product.gallery_images) ? product.gallery_images : [];
  const images = Array.from(new Set([product.image_url, ...gallery].filter(Boolean) as string[]));
  const hero = activeImage ?? images[0] ?? null;
  const onSale = Boolean(product.sale_price);

  function addToCart(qty: number) {
    if (!product) return false;
    if (!inStock) {
      toast.error("This product is sold out.");
      return false;
    }
    if (qty > product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} items are currently available.`);
      return false;
    }
    cart.add(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        image_url: product.image_url,
        unit_price: unit,
      },
      qty,
    );
    return true;
  }

  return (
    <main className="min-h-screen bg-card px-5 pt-32 pb-28 md:px-10 md:pt-44 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center gap-2 text-[11px] tracking-widest text-muted-foreground uppercase">
          <Link to="/shop" className="transition-colors hover:text-brand-red">
            Shop
          </Link>
          <span className="text-border">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          {/* Gallery */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] border border-border/60 bg-secondary shadow-[0_30px_80px_-40px_rgba(10,10,26,0.45)]">
              {hero ? (
                <img
                  src={hero}
                  alt={product.name}
                  width={1200}
                  height={1500}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs tracking-widest text-muted-foreground uppercase">
                  No image
                </div>
              )}
              {onSale && (
                <span className="absolute top-5 left-5 rounded-full bg-brand-red px-4 py-1.5 text-[10px] font-semibold tracking-widest text-on-dark uppercase">
                  Sale
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(src)}
                    aria-label="View image"
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                      hero === src
                        ? "border-brand-red"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt={product.name}
                      loading="lazy"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:py-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold tracking-widest text-brand-blue uppercase">
                {product.category ?? "Beauty"}
              </span>
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-brand-blue uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" /> In stock
                </span>
              ) : (
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Sold out
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-4xl leading-[1.05] text-ink md:text-6xl">
              {product.name}
            </h1>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="font-display text-4xl text-brand-red">{formatPrice(unit)}</span>
              {onSale && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {product.short_description && (
              <p className="mt-6 text-base leading-relaxed text-ink/80">
                {product.short_description}
              </p>
            )}

            <div className="my-8 h-px w-full bg-border/70" />

            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center rounded-full border border-border bg-card">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3.5 transition-colors hover:text-brand-red"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  aria-label="Quantity"
                  className="w-12 bg-transparent text-center text-sm font-semibold outline-none"
                  value={quantity}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                    setQuantity(Math.min(max, Math.max(1, n || 1)));
                  }}
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(max, q + 1))}
                  className="p-3.5 transition-colors hover:text-brand-red"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">Order any quantity</span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!inStock}
                onClick={() => {
                  if (addToCart(quantity)) navigate({ to: "/checkout" });
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-xs font-semibold tracking-widest text-on-dark uppercase transition-colors hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" /> Add to Cart
              </button>
              <button
                type="button"
                disabled={!inStock}
                onClick={() => {
                  if (addToCart(quantity)) navigate({ to: "/checkout" });
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink px-8 py-4 text-xs font-semibold tracking-widest uppercase transition-colors hover:bg-ink hover:text-on-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-4 w-4" /> Buy Now
              </button>
              <button
                type="button"
                aria-pressed={wishlist.has(product.id)}
                onClick={() => {
                  const added = wishlist.toggle({
                    product_id: product.id,
                    slug: product.slug,
                    name: product.name,
                    image_url: product.image_url,
                    unit_price: unit,
                  });
                  toast.success(
                    added
                      ? `${product.name} saved to your wishlist`
                      : `${product.name} removed from your wishlist`,
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-4 text-xs font-semibold tracking-widest uppercase transition-colors hover:border-brand-red hover:text-brand-red"
              >
                <Heart
                  className={`h-4 w-4 ${wishlist.has(product.id) ? "fill-brand-red text-brand-red" : ""}`}
                />
                {wishlist.has(product.id) ? "Saved" : "Save"}
              </button>
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl border border-border/70 bg-background/60 p-5 sm:grid-cols-3">
              {[
                { icon: Truck, label: "Nationwide delivery" },
                { icon: ShieldCheck, label: "100% authentic" },
                { icon: Sparkles, label: "Salon-trusted quality" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-brand-red" />
                  <span className="text-xs leading-snug text-ink/75">{label}</span>
                </div>
              ))}
            </div>

            {product.description && (
              <section className="mt-10">
                <h2 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Product details
                </h2>
                <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ink/75">
                  {product.description}
                </p>
              </section>
            )}

            {product.sku && (
              <p className="mt-8 text-[11px] tracking-widest text-muted-foreground uppercase">
                SKU: {product.sku}
              </p>
            )}
          </div>
        </div>
      </div>
      <AdSlot placement="product_page" />
    </main>
  );
}
