import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import logoAsset from "../assets/logo.png";
import { useSettings } from "../lib/site-settings";

const allLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/before-and-after", label: "Before & After" },
  { to: "/book", label: "Book A Service" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact Us" },
] as const;

function AnnouncementBar() {
  const { announcement } = useSettings();
  if (!announcement.enabled || !announcement.text) return null;
  return (
    <div className="bg-brand-red px-4 py-2 text-center text-xs font-medium text-on-brand sm:text-sm">
      <span>{announcement.text}</span>
      {announcement.link_url && announcement.link_label ? (
        <a href={announcement.link_url} className="ml-2 underline underline-offset-2">
          {announcement.link_label}
        </a>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const links = allLinks.filter(
    (l) =>
      (l.to !== "/shop" || settings.shop.enabled) &&
      (l.to !== "/book" || settings.booking.enabled),
  );
  const siteName = settings.general.site_name;
  const logo = settings.general.logo_url || logoAsset;

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full border-b border-border bg-card text-ink shadow-sm transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
    >
      <AnnouncementBar />
      <div className="flex items-center justify-between px-6 py-4 md:px-12 md:py-5">
        <Link to="/" aria-label={`${siteName} home`} className="shrink-0">
          <img
            src={logo}
            alt={siteName}
            className="h-10 w-auto max-w-[180px] object-contain md:h-12 md:max-w-[220px]"
            loading="eager"
          />
        </Link>

        <nav className="hidden items-center gap-5 text-xs font-semibold uppercase tracking-wider lg:flex xl:gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="transition-colors hover:text-brand-blue"
              activeProps={{ className: "text-brand-blue" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`h-0.5 w-6 bg-ink transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span className={`h-0.5 w-6 bg-ink ${open ? "opacity-0" : ""}`} />
            <span
              className={`h-0.5 w-6 bg-ink transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-6 border-t border-border bg-card px-6 py-8 text-sm font-semibold uppercase tracking-wide text-foreground lg:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              activeProps={{ className: "text-brand-blue" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
