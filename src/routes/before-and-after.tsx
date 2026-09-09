import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";

import beforeAfterHero from "../assets/before-after-hero.png";

import { publicApi } from "@/lib/admin-api";
import { AdSlot } from "@/components/ad-slot";

const title = "Before & After — Mayor Beauty Place";
const description =
  "See real transformations at Mayor Beauty Place in London. Browse our Before & After gallery of beauty treatments and results.";
const keywords =
  "beauty before and after, salon transformations London, lash results, facial results, Mayor Beauty Place gallery";

export const Route = createFileRoute("/before-and-after")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/before-and-after" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/before-and-after" }],
  }),
  component: BeforeAfter,
});

function BeforeAfter() {
  const { data, isLoading } = useQuery({
    queryKey: ["transformations"],
    queryFn: () => publicApi.transformations(),
    retry: false,
  });
  const transformations = data?.transformations ?? [];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={beforeAfterHero}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/70 to-ink/85" />
        </div>
        <div className="relative px-6 pt-44 pb-28 text-on-dark md:px-12 md:pt-56 md:pb-36">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-on-dark/25 bg-on-dark/10 px-5 py-2 text-xs font-medium tracking-widest text-on-dark/90 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
              Gallery
            </span>
            <h1 className="max-w-3xl font-display text-6xl leading-[1.02] md:text-8xl">
              Before & <em className="italic text-brand-red">After</em>
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed font-light text-on-dark/75">
              Real clients, real results. Browse a selection of transformations
              created at Mayor Beauty Place — every look built on professional
              ethics and quality products.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 max-w-xl">
            <span className="mb-4 block font-sans font-medium text-[11px] uppercase tracking-[0.3em] text-brand-red">
              Transformations
            </span>
            <h2 className="font-display text-5xl leading-tight md:text-6xl">
              Real <em className="italic text-brand-blue">Results</em>
            </h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading transformations…</p>
          ) : transformations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              New transformations are coming soon — check back shortly.
            </p>
          ) : (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {transformations.map((t) => (
              <article
                key={t.id}
                className="overflow-hidden rounded-3xl bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="grid grid-cols-2 gap-1">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={t.before_image_url}
                      alt={`Before — ${t.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-semibold tracking-widest text-on-dark uppercase">
                      Before
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={t.after_image_url}
                      alt={`After — ${t.name}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-brand-red px-3 py-1 text-[10px] font-semibold tracking-widest text-on-brand uppercase">
                      After
                    </span>
                  </div>
                </div>
                <div className="p-7">
                  <div className="flex items-center gap-2 text-brand-red">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-sans font-medium text-[11px] uppercase tracking-[0.3em]">
                      Transformation
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl">{t.name}</h3>
                  {t.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
      </section>
      <AdSlot placement="gallery" />

      {/* CTA */}
      <section className="bg-brand-blue px-6 py-24 text-center text-on-brand md:px-12 md:py-32">
        <p className="mx-auto max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Your transformation could be
          <em className="italic"> next.</em>
        </p>
        <Link
          to="/book"
          className="group mt-12 inline-flex items-center gap-2 rounded-full bg-on-brand px-10 py-4 text-sm font-semibold text-brand-blue shadow-lift transition-transform hover:scale-105"
        >
          Book A Service
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </main>
  );
}
