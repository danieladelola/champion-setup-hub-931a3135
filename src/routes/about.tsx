import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import heroSpa from "../assets/about-hero-spa.jpg";
import aboutFacial from "../assets/about/about-facial.jpg";
import aboutMassage from "../assets/about/about-massage.jpg";
import aboutManicure from "../assets/about/about-manicure.jpg";
import aboutTeeth from "../assets/about/about-teeth.jpg";
import { AdSlot } from "@/components/ad-slot";

const title = "About Us — Mayor Beauty Place | Rye Lane Beauty Salon";
const description =
  "We have a successful career in the beauty industry — built on professional ethics, expert consultation and quality products. Visit our London salon.";
const keywords =
  "about Mayor Beauty Place, beauty salon London, beauty consultation, professional beauty therapists, Rye Lane salon";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/about" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const highlights = [
  "Beauty Treatments",
  "Beauty Consultation",
  "Professional Ethics",
  "Quality products and more",
];

const stats = [
  { value: "1,245", label: "Satisfied Customers" },
  { value: "40", label: "Beauty Treatments" },
  { value: "20", label: "Years Experience" },
  { value: "125", label: "Professional Team" },
];

const values = [
  {
    title: "Precision Care",
    body: "We believe that beauty is in the details. Every treatment is performed with surgical precision and artistic flair.",
  },
  {
    title: "Authentic Ethos",
    body: "Integrity is our foundation. We only recommend treatments and products that truly benefit our clients' wellbeing.",
  },
  {
    title: "Modern Mastery",
    body: "Constantly evolving. We bring global innovation and luxury standards to our local Rye Lane community.",
  },
];

function About() {
  return (
    <main className="bg-secondary">
      {/* HERO BAND */}
      <section className="relative isolate overflow-hidden border-b border-brand-red/20 px-8 pt-40 pb-28 text-center md:pt-52">
        <img
          src={heroSpa}
          alt="Therapist performing a relaxing massage treatment in a candlelit spa room"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-ink/70" />
        <h1 className="mx-auto max-w-3xl font-display text-5xl leading-[1.1] italic text-on-dark md:text-7xl">
          We Have a Successful Career in the Beauty Industry
        </h1>
      </section>

      {/* COLLAGE & CHECKLIST */}
      <section className="mx-auto grid max-w-7xl items-center gap-16 bg-secondary px-8 py-24 md:grid-cols-2 md:px-16">
        <div className="grid grid-cols-5 grid-rows-6 gap-3">
          <img
            src={aboutFacial}
            alt="Esthetician applying a facial treatment at Mayor Beauty Place in Rye Lane"
            className="col-span-3 row-span-6 h-full w-full object-cover shadow-soft"
            loading="lazy"
          />
          <img
            src={aboutMassage}
            alt="Relaxing shoulder massage treatment"
            className="col-span-2 row-span-4 h-full w-full border-4 border-secondary object-cover shadow-lift"
            loading="lazy"
          />
          <img
            src={aboutManicure}
            alt="Close-up of a professional manicure treatment"
            className="col-span-2 row-span-2 h-full w-full object-cover shadow-soft"
            loading="lazy"
          />
        </div>

        <div className="space-y-8">
          <span className="block text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
            About Mayor Beauty Place
          </span>
          <h2 className="font-display text-4xl leading-tight text-brand-blue md:text-5xl">
            We Have A Successful Career In The Beauty Industry
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            The beauty industry is a unique realm where work ethics and product usage play pivotal
            roles in shaping the client experience and the reputation of beauty professionals.
          </p>

          <div className="grid items-start gap-8 sm:grid-cols-2">
            <div className="space-y-6">
              <ul className="space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-brand-red" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/book"
                className="inline-block bg-brand-blue px-8 py-4 text-[10px] font-bold tracking-[0.25em] uppercase text-on-brand transition-opacity hover:opacity-90"
              >
                Book A Service
              </Link>
            </div>
            <img
              src={aboutTeeth}
              alt="Client receiving a relaxing facial beauty treatment"
              className="aspect-[4/5] w-full object-cover shadow-soft"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="bg-brand-blue px-8 py-20 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 max-w-xl">
            <span className="block text-[10px] font-bold tracking-[0.25em] uppercase text-on-brand/60">
              By The Numbers
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight text-on-dark md:text-4xl">
              Two decades of measurable results
            </h2>
          </div>
          <dl className="grid grid-cols-2 gap-y-12 border-t border-on-brand/20 pt-12 md:grid-cols-4 md:gap-x-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="px-0 md:border-r md:border-on-brand/20 md:px-8 md:first:pl-0 md:last:border-r-0"
              >
                <dd className="font-display text-5xl italic text-on-dark md:text-6xl">
                  {stat.value}
                </dd>
                <dt className="mt-3 text-[9px] font-semibold tracking-[0.2em] uppercase text-on-brand/70">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-card px-8 py-24 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <span className="block text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
              Our Core Values
            </span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-brand-blue md:text-5xl">
              The standards behind every treatment
            </h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
            {values.map((value, index) => (
              <div key={value.title} className="bg-card p-10">
                <span className="font-display text-2xl italic text-brand-red">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
                  {value.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA BAND */}
      <section className="relative overflow-hidden bg-brand-red px-8 py-20 text-center">
        <img
          src={aboutMassage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
          loading="lazy"
        />
        <div className="relative mx-auto max-w-2xl space-y-10">
          <h2 className="font-display text-4xl leading-tight italic text-on-brand md:text-5xl">
            Make an Appointment &amp; Get a 20% Discount on All Treatments
          </h2>
          <Link
            to="/book"
            className="inline-block border border-transparent bg-ink px-12 py-5 text-[10px] font-bold tracking-[0.3em] uppercase text-on-dark transition-all hover:border-on-brand/20"
          >
            Reserve Appointment
          </Link>
        </div>
      </section>
      <AdSlot placement="about" />
    </main>
  );
}
