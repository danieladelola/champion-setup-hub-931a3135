import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import logoAsset from "../assets/logo.png";
import paymentMethodsUrl from "../assets/payment-methods.png";
import { useSettings } from "../lib/site-settings";
import { addressLines, renderCopyright, telHref } from "../lib/settings";

function TikTok({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.07A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.9 2H22l-6.77 7.73L23.5 22h-7.1l-4.6-6.2L6.4 22H3.3l7.1-8.1L2.8 2h7.1l4.3 5.8L18.9 2Zm-1.2 18h1.7L7.4 3.8H5.6L17.7 20Z" />
    </svg>
  );
}

const learnMore = [
  { label: "My Account", to: "/book" },
  { label: "Before & After", to: "/before-and-after" },
  { label: "Help Center", to: "/contact" },
  { label: "Contact us", to: "/contact" },
] as const;

const quickLinks = [
  { label: "Term of services", to: "/terms-of-service" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Cookie Policy", to: "/cookie-policy" },
] as const;

export function SiteFooter() {
  const settings = useSettings();
  const { contact, social, footer, general, payments } = settings;
  const siteName = general.site_name;
  const logo = general.logo_url || logoAsset;

  const socials: { label: string; Icon: LucideIcon | typeof TikTok; href: string }[] = [
    { label: "Facebook", Icon: Facebook, href: social.facebook },
    { label: "TikTok", Icon: TikTok, href: social.tiktok },
    { label: "Instagram", Icon: Instagram, href: social.instagram },
    { label: "YouTube", Icon: Youtube, href: social.youtube },
    { label: "X", Icon: XIcon, href: social.x },
    { label: "LinkedIn", Icon: Linkedin, href: social.linkedin },
  ].filter((s) => Boolean(s.href));

  const address = addressLines(contact.address);
  const phones = [contact.phone, contact.phone_alt].filter(Boolean);

  return (
    <footer className="bg-black px-6 pt-20 pb-6 text-on-dark md:px-12 md:pt-24 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Brand + social */}
          <div className="max-w-xs">
            <Link to="/" aria-label={`${siteName} home`} className="inline-block">
              <img
                src={logo}
                alt={siteName}
                className="h-14 w-auto max-w-[220px] object-contain"
                loading="lazy"
              />
            </Link>
            {footer.about_text ? (
              <p className="mt-5 text-sm leading-relaxed text-on-dark/70">{footer.about_text}</p>
            ) : null}
            {footer.show_socials && socials.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {socials.map(({ label, Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-brand-red transition-colors hover:bg-brand-red hover:text-on-brand"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Learn More */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-on-dark">
              Learn More
            </h3>
            <ul className="space-y-3 text-sm">
              {learnMore.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-on-dark/70 transition-colors hover:text-brand-red"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-on-dark">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-on-dark/70 transition-colors hover:text-brand-red"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Reach Us */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-on-dark">
              Reach Us
            </h3>
            <ul className="space-y-4 text-sm">
              {address.length > 0 ? (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
                  <p className="leading-relaxed text-on-dark/70">
                    {address.map((line, i) => (
                      <span key={line + i}>
                        {line}
                        {i < address.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </p>
                </li>
              ) : null}
              {contact.email ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-brand-red" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="min-w-0 break-all text-on-dark/70 transition-colors hover:text-brand-red"
                  >
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {phones.map((phone) => (
                <li key={phone} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-brand-red" />
                  <a
                    href={telHref(phone)}
                    className="text-on-dark/70 transition-colors hover:text-brand-red"
                  >
                    {phone}
                  </a>
                </li>
              ))}
              {contact.opening_hours ? (
                <li className="text-on-dark/60">{contact.opening_hours}</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-6 border-t border-on-dark/10 pt-8 md:flex-row md:justify-between">
          <p className="text-center text-xs text-on-dark/50 md:text-left">
            {renderCopyright(footer.copyright)}
          </p>
          {footer.show_payment_methods ? (
            <div className="flex flex-col items-center gap-3 md:items-end">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-dark/40">
                We Accept
              </span>
              <img
                src={paymentMethodsUrl}
                alt={payments.accepted_methods_note || "Accepted payment methods"}
                loading="lazy"
                className="h-14 w-auto max-w-full md:h-16"
              />
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
