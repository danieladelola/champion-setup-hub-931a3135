import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Check,
  ClipboardList,
  Gem,
  Heart,
  MessageCircle,
  Play,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import heroImg from "../assets/home-hero.png";
import aboutMassage from "../assets/about/about-massage.jpg";
import aboutTeeth from "../assets/about/about-teeth.jpg";
import aboutManicure from "../assets/about/about-manicure.jpg";
import videoCover from "../assets/video-cover.jpg";
import { Testimonials } from "../components/testimonials";
import { toast } from "sonner";

import { publicApi, type Product } from "../lib/admin-api";
import { formatPrice, unitPriceOf, useCart } from "../lib/cart";
import { useWishlist } from "../lib/wishlist";
import { AdSlot } from "@/components/ad-slot";
import { useSettings } from "../lib/site-settings";

const title = "Mayor Beauty Place | Elevate Your Everyday Look";
const description =
  "Mayor Beauty Place: a successful career in the beauty industry. Beauty treatments, expert consultation, professional ethics and quality products in London.";
const keywords =
  "beauty salon London, beauty treatments Rye Lane, lash extensions London, facials, manicure, beauty products UK, Mayor Beauty Place";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const pillars = [
  {
    icon: Sparkles,
    title: "Beauty Treatments",
    body: "Advanced aesthetic procedures tailored to your unique features and skin profile.",
    accent: "text-brand-blue bg-brand-blue/10",
  },
  {
    icon: MessageCircle,
    title: "Beauty Consultation",
    body: "Deep analysis of your beauty goals with a personal roadmap for long-term skin health.",
    accent: "text-brand-red bg-brand-red/10",
  },
  {
    icon: ShieldCheck,
    title: "Professional Ethics",
    body: "Uncompromising standards in hygiene, privacy, and technical execution for every service.",
    accent: "text-brand-blue bg-brand-blue/10",
  },
  {
    icon: Gem,
    title: "Quality Products",
    body: "Only the world's most effective, trusted beauty formulas make it onto our shelves.",
    accent: "text-brand-red bg-brand-red/10",
  },
];

const steps = [
  {
    icon: Calendar,
    title: "Book an Appointment",
    body: "Booking an appointment with us is a straightforward process that involves scheduling a specific date and time to meet or interact with our experts.",
  },
  {
    icon: ClipboardList,
    title: "Get Your Schedule",
    body: "Our available time is visible on our calendar for you to choose from, making it easy to find the perfect slot for your treatment.",
  },
  {
    icon: Users,
    title: "Meet With Our Experts",
    body: "Our beauty experts are not just professionals; they are true artists in their field. From hairstylists to makeup artists and skincare specialists, their skills are second to none.",
  },
  {
    icon: Check,
    title: "Your Skin Feels New",
    body: "Our beauty experts understand that each client is unique. They take the time to listen, learn about your preferences, and tailor their services to enhance your natural beauty.",
  },
];

function VideoCover() {
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timer.current = setTimeout(() => setHidden(true), 2500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (timer.current) clearTimeout(timer.current);
        setHidden(true);
      }}
      aria-label="Play treatment video"
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={videoCover}
        alt="Mayor Beauty Place treatment preview"
        width={1024}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
      <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue text-on-brand shadow-lift transition-transform hover:scale-105 active:scale-95">
        <Play className="h-6 w-6 fill-current" />
      </span>
    </button>
  );
}

function ShopTeaserCard({ product: p }: { product: Product }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.has(p.id);
  const inStock = p.stock_quantity > 0;

  return (
    <article className="group rounded-3xl bg-on-dark/10 p-5 transition-colors hover:bg-on-dark/20">
      <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-2xl bg-on-dark/10">
        <button
          type="button"
          aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          aria-pressed={saved}
          onClick={() => {
            const added = wishlist.toggle({
              product_id: p.id,
              slug: p.slug,
              name: p.name,
              image_url: p.image_url,
              unit_price: unitPriceOf(p),
            });
            toast.success(
              added
                ? `${p.name} saved to your wishlist`
                : `${p.name} removed from your wishlist`,
            );
          }}
          className="absolute top-3 right-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-ink shadow-soft backdrop-blur transition-colors hover:text-brand-red"
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-brand-red text-brand-red" : ""}`} />
        </button>
        <Link to="/shop/$slug" params={{ slug: p.slug }} className="block h-full w-full">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              width={800}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
        </Link>
      </div>
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <div className="text-[10px] tracking-widest text-on-dark/60 uppercase">
            {p.category ?? "Beauty"}
          </div>
          <h3 className="mt-1 text-sm font-semibold">
            <Link to="/shop/$slug" params={{ slug: p.slug }}>
              {p.name}
            </Link>
          </h3>
        </div>
        <p className="font-display text-lg">{formatPrice(unitPriceOf(p))}</p>
      </div>
      <button
        type="button"
        disabled={!inStock}
        onClick={() => {
          cart.add(
            {
              product_id: p.id,
              slug: p.slug,
              name: p.name,
              image_url: p.image_url,
              unit_price: unitPriceOf(p),
            },
            1,
          );
          toast.success(`${p.name} added to your bag`);
        }}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-on-dark px-5 py-2.5 text-xs font-semibold text-[#2645D8] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        {inStock ? "Add to Bag" : "Sold out"}
      </button>
    </article>
  );
}

function Index() {
  const settings = useSettings();
  const home = settings.home;
  const { data: productData } = useQuery({
    queryKey: ["products"],
    queryFn: () => publicApi.products(),
  });
  const all = productData?.products ?? [];
  const featured = [...all]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, home.shop_teaser_count);


  return (
    <main>
      {/* Hero */}
      <section className="relative flex h-screen w-full items-center overflow-hidden bg-ink">
        <img
          src={home.hero_image_url || heroImg}
          alt={home.hero_title ? `${home.hero_title} ${home.hero_title_accent}`.trim() : settings.general.site_name}
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/45 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />

        <div className="relative w-full px-6 md:px-12">
          <div className="max-w-2xl">
            {home.hero_badge ? (
              <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-on-dark/25 bg-on-dark/10 px-5 py-2 text-xs font-medium tracking-widest text-on-dark/90 uppercase backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                {home.hero_badge}
              </span>
            ) : null}
            <h1 className="animate-reveal font-display text-6xl leading-[1.02] text-on-dark md:text-8xl">
              {home.hero_title}
              {home.hero_title_accent ? (
                <>
                  <br />
                  <em className="italic text-brand-red">{home.hero_title_accent}</em>
                </>
              ) : null}
            </h1>
            {home.hero_subtitle ? (
              <p className="mt-8 max-w-md text-base leading-relaxed font-light text-on-dark/80">
                {home.hero_subtitle}
              </p>
            ) : null}
            <div className="mt-12 flex flex-wrap gap-4">
              {home.primary_cta_label && home.primary_cta_url ? (
                <a
                  href={home.primary_cta_url}
                  className="group inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-4 text-sm font-semibold text-on-brand shadow-lift transition-colors hover:bg-brand-blue"
                >
                  {home.primary_cta_label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              ) : null}
              {home.secondary_cta_label && home.secondary_cta_url ? (
                <a
                  href={home.secondary_cta_url}
                  className="rounded-full border border-on-dark/40 px-8 py-4 text-sm font-semibold text-on-dark transition-colors hover:border-on-dark hover:bg-on-dark hover:text-ink"
                >
                  {home.secondary_cta_label}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <AdSlot placement="home_after_hero" />

      {/* About */}
      {home.show_about && (
      <section className="bg-background px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Image Composition */}
          <div className="relative grid h-[520px] grid-cols-12 grid-rows-12 gap-4 sm:h-[600px] lg:h-[700px]">
            <div className="col-start-1 col-end-9 row-start-1 row-end-8 z-0 overflow-hidden rounded-sm shadow-2xl">
              <img
                src={aboutMassage}
                alt="Professional massage treatment at luxury spa"
                width={800}
                height={1000}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
            <div className="col-start-6 col-end-13 row-start-4 row-end-10 z-10 overflow-hidden rounded-sm border-8 border-background shadow-2xl">
              <img
                src={aboutTeeth}
                alt="Professional teeth whitening procedure"
                width={600}
                height={600}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
            <div className="col-start-2 col-end-7 row-start-8 row-end-13 z-20 overflow-hidden rounded-sm shadow-xl">
              <img
                src={aboutManicure}
                alt="Elegant manicure treatment detail"
                width={512}
                height={512}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-border" />
                <span className="font-sans font-medium text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  About Mayor Beauty Place
                </span>
              </div>
              <h2 className="font-display text-5xl leading-tight text-ink md:text-6xl">
                We Have a Successful Career in the
                <br />
                <em className="italic text-brand-red">beauty industry</em>
              </h2>
              <p className="max-w-lg text-lg font-light leading-relaxed text-muted-foreground">
                The beauty industry is a unique realm where work ethics and
                product usage play pivotal roles in shaping the client experience
                and the reputation of beauty professionals. We are proud to say
                that we have served over 5000 clients with amazing reviews about
                our:
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 gap-y-8 gap-x-12 sm:grid-cols-2">
              {[
                {
                  title: "Beauty Treatments",
                  body: "Advanced aesthetic procedures tailored to your unique features and skin profile.",
                },
                {
                  title: "Beauty Consultation",
                  body: "Deep analysis of your beauty goals with a personal roadmap for long-term skin health.",
                },
                {
                  title: "Professional Ethics",
                  body: "Uncompromising standards in hygiene, privacy, and technical execution for every service.",
                },
                {
                  title: "Quality products and more",
                  body: "Only the world's most effective, trusted beauty formulas make it onto our shelves.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group space-y-2 border-l border-border pl-6 transition-colors duration-300 hover:border-brand-blue"
                >
                  <h4 className="font-sans font-medium text-[11px] font-semibold uppercase tracking-widest text-ink">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-snug text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/book"
                className="inline-block rounded-sm bg-ink px-12 py-5 text-xs font-semibold uppercase tracking-[0.25em] text-on-brand shadow-lift transition-all duration-500 hover:-translate-y-1 hover:bg-brand-blue"
              >
                Book A Service
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Pillars */}
      {home.show_pillars && (
      <section className="bg-secondary px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-xl">
            <span className="mb-4 block font-sans font-medium text-[11px] uppercase tracking-[0.3em] text-brand-red">
              What We Do
            </span>
            <h2 className="font-display text-5xl leading-tight md:text-6xl">
              Four Pillars of
              <em className="italic text-brand-blue"> Excellence</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="group rounded-3xl bg-card p-8 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift"
                >
                  <div
                    className={`mb-8 flex h-14 w-14 items-center justify-center rounded-2xl ${p.accent}`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-3 font-display text-2xl">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}
      <AdSlot placement="home_mid" />

      {/* Shop teaser */}
      {home.show_shop_teaser && settings.shop.enabled && (
      <section className="bg-[#2645D8] px-6 py-16 text-on-dark md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="mb-4 block font-sans font-medium text-[11px] uppercase tracking-[0.3em] text-on-dark/70">
                Beauty Empire · The Shop
              </span>
              <h2 className="font-display text-5xl leading-tight md:text-6xl">
                The <em className="italic text-on-dark/80">Selection</em>
              </h2>
            </div>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full border border-on-dark/30 px-6 py-3 text-xs font-semibold tracking-widest uppercase transition-colors hover:border-on-dark hover:bg-on-dark hover:text-[#2645D8]"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ShopTeaserCard key={p.id} product={p} />
            ))}
          </div>
          ) : (
            <p className="text-sm text-on-dark/60">No products are currently available.</p>
          )}
        </div>
      </section>
      )}

      {/* How We Work */}
      {home.show_steps && (
      <section className="bg-card px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Video */}
          {home.show_video && (
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black shadow-lift">
            <iframe
              src="https://www.youtube.com/embed/ezlAAB0NWVU?autoplay=1&mute=1&start=38&rel=0&modestbranding=1&playsinline=1&controls=0"
              title="Mayor Beauty Place treatments"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
            <VideoCover />
          </div>
          )}

          {/* Steps */}
          <div className="pt-10 lg:pt-0">
            <span className="mb-4 block font-sans font-medium text-[11px] uppercase tracking-[0.3em] text-brand-blue">
              How We Work
            </span>
            <h2 className="mb-12 font-display text-4xl leading-tight md:text-5xl">
              Make Your Look Even More Perfect With Our{" "}
              <em className="italic text-brand-red">Treatments</em>
            </h2>

            <div className="relative">
              <div className="absolute top-8 bottom-8 left-8 w-px bg-border" />
              <div className="space-y-8">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="relative flex gap-6">
                      <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center bg-brand-blue text-on-brand">
                        <Icon className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-display text-2xl">{step.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
      <AdSlot placement="home_bottom" />

      {home.show_testimonials && <Testimonials />}
    </main>
  );
}
