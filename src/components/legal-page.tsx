import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import legalHero from "../assets/legal-hero.jpg";
import { useSettings } from "../lib/site-settings";
import { addressLines, telHref } from "../lib/settings";

export type LegalSection = { heading: string; body: ReactNode };

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  lastUpdated,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
}) {
  const { general, contact } = useSettings();
  const address = addressLines(contact.address);

  return (
    <main className="bg-secondary">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-brand-red/20 px-6 pt-36 pb-20 text-center md:px-12 md:pt-48 md:pb-28">
        <img
          src={legalHero}
          alt={`${general.site_name} salon reception`}
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-ink/75" />
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-red">{eyebrow}</p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-[1.1] italic text-on-dark md:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-on-dark/75 md:text-base">
          {intro}
        </p>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-on-dark/50">
          Last updated {lastUpdated}
        </p>
      </section>

      {/* BODY */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[240px_1fr] md:px-10 md:py-24">
        <nav aria-label="On this page" className="md:sticky md:top-32 md:self-start">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            On this page
          </h2>
          <ul className="space-y-2 text-sm">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a
                  href={`#section-${i + 1}`}
                  className="text-foreground/70 transition-colors hover:text-brand-blue"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rounded-2xl bg-card p-6 shadow-card md:p-10">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <article key={s.heading} id={`section-${i + 1}`} className="scroll-mt-32">
                <h2 className="font-display text-2xl italic text-foreground md:text-3xl">
                  <span className="mr-3 text-base not-italic text-brand-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.heading}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {s.body}
                </div>
              </article>
            ))}
          </div>

          {/* CONTACT CARD */}
          <div className="mt-12 rounded-2xl bg-ink p-6 text-on-dark md:p-8">
            <h2 className="font-display text-2xl italic">Questions about this policy?</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-dark/70">
              Contact {general.site_name} and a member of our team will help you.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {contact.email ? (
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="break-all text-on-dark/80 underline underline-offset-4 transition-colors hover:text-brand-red"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {contact.phone ? (
                <li>
                  <a
                    href={telHref(contact.phone)}
                    className="text-on-dark/80 transition-colors hover:text-brand-red"
                  >
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {address.length > 0 ? (
                <li className="text-on-dark/60">{address.join(", ")}</li>
              ) : null}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-brand transition-opacity hover:opacity-90"
              >
                Contact Us
              </Link>
              <Link
                to="/terms-of-service"
                className="inline-flex items-center justify-center rounded-full border border-on-dark/25 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-dark transition-colors hover:border-brand-red"
              >
                Terms
              </Link>
              <Link
                to="/privacy-policy"
                className="inline-flex items-center justify-center rounded-full border border-on-dark/25 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-dark transition-colors hover:border-brand-red"
              >
                Privacy
              </Link>
              <Link
                to="/cookie-policy"
                className="inline-flex items-center justify-center rounded-full border border-on-dark/25 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-dark transition-colors hover:border-brand-red"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
