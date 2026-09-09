/**
 * Site settings shared by the admin panel, the API and the public frontend.
 *
 * This module is client-safe: it holds the Zod schema, the defaults used
 * before anything has been configured, and small display helpers. The server
 * persists a single JSON document (see `settings.server.ts`) that is always
 * parsed through `settingsSchema`, so every consumer can rely on a complete,
 * validated object.
 */
import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

/** Optional absolute/relative URL. Empty string means "not configured". */
const linkUrl = text(500).refine(
  (v) => v === "" || /^(https?:\/\/|\/|mailto:|tel:)/i.test(v),
  { message: "Enter a full URL starting with http:// or https://" },
);

/** Image reference: an uploaded `/api/media/...` path or an absolute URL. */
const imageUrl = text(500).refine((v) => v === "" || /^(https?:\/\/|\/)/i.test(v), {
  message: "Enter a valid image URL",
});

const email = text(200).refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
  message: "Enter a valid email address",
});

const time = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time such as 09:30");

const internalPath = text(200).refine((v) => v === "" || v.startsWith("/"), {
  message: "Use an internal path such as /book",
});

export const CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound (GBP)" },
  { code: "USD", symbol: "$", label: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira (NGN)" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar (CAD)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (AUD)" },
  { code: "ZAR", symbol: "R", label: "South African Rand (ZAR)" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi (GHS)" },
] as const;

export const TIMEZONES = [
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Johannesburg",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
] as const;

export const settingsSchema = z.object({
  general: z
    .object({
      site_name: text(120).default("Mayor Beauty Place"),
      tagline: text(200).default("Elevate Your Everyday Look"),
      logo_url: imageUrl.default(""),
      favicon_url: imageUrl.default(""),
      currency_code: z.enum(CURRENCIES.map((c) => c.code) as [string, ...string[]]).default("GBP"),
      timezone: z.enum(TIMEZONES as unknown as [string, ...string[]]).default("Europe/London"),
    })
    .default({}),

  contact: z
    .object({
      email: email.default("info.mayorbeautyplace@gmail.com"),
      phone: text(40).default("(+44) 7901910007"),
      phone_alt: text(40).default("02083897978"),
      whatsapp: text(40).default(""),
      address: text(400).default("110/112 Peckham Rye Lane\nLondon, United Kingdom.\nPost Code: SE15 4RZ"),
      opening_hours: text(300).default("Monday – Saturday, 11:00 – 18:00"),
      map_embed_url: linkUrl.default(
        "https://www.openstreetmap.org/export/embed.html?bbox=-0.0719%2C51.4673%2C-0.0659%2C51.4733&layer=mapnik&marker=51.4703%2C-0.0689",
      ),
      show_map: z.boolean().default(true),
      response_time_note: text(200).default("Fill in the form and our team will get back to you within 24 hours."),
    })
    .default({}),

  social: z
    .object({
      facebook: linkUrl.default("https://www.facebook.com/share/199ve8Fd2U/?mibextid=wwXIfr"),
      instagram: linkUrl.default("https://www.instagram.com/mayorbeautyplace?stkn=M2RucWVhamMzbHht"),
      tiktok: linkUrl.default("https://www.tiktok.com/@mayorbeautyplace58?_r=1&_t=ZS-99ZMuqFhC7O"),
      youtube: linkUrl.default(""),
      x: linkUrl.default(""),
      linkedin: linkUrl.default(""),
    })
    .default({}),

  announcement: z
    .object({
      enabled: z.boolean().default(false),
      text: text(200).default(""),
      link_label: text(60).default(""),
      link_url: linkUrl.default(""),
    })
    .default({}),

  home: z
    .object({
      hero_badge: text(120).default("Beauty Empire · Peckham, London"),
      hero_title: text(120).default("Where Beauty"),
      hero_title_accent: text(120).default("Meets Artistry"),
      hero_subtitle: text(400).default(
        "A successful career in the beauty industry, built on professional ethics, expert consultation and quality products — all under one roof in Peckham.",
      ),
      hero_image_url: imageUrl.default(""),
      primary_cta_label: text(40).default("Book A Service"),
      primary_cta_url: internalPath.default("/book"),
      secondary_cta_label: text(40).default("Shop Products"),
      secondary_cta_url: internalPath.default("/shop"),
      show_about: z.boolean().default(true),
      show_pillars: z.boolean().default(true),
      show_steps: z.boolean().default(true),
      show_video: z.boolean().default(true),
      show_shop_teaser: z.boolean().default(true),
      show_testimonials: z.boolean().default(true),
      shop_teaser_count: z.coerce.number().int().min(2).max(12).default(6),
    })
    .default({}),

  footer: z
    .object({
      about_text: text(600).default(
        "Our beauty experts understand that each client is unique. They take the time to listen, learn about your preferences, and tailor their services to enhance your natural beauty.",
      ),
      copyright: text(200).default("© {year} Mayor Beauty Place. All rights reserved."),
      show_payment_methods: z.boolean().default(true),
      show_socials: z.boolean().default(true),
    })
    .default({}),

  booking: z
    .object({
      enabled: z.boolean().default(true),
      disabled_message: text(300).default("Online booking is temporarily closed. Please call us to arrange your appointment."),
      open_time: time.default("11:00"),
      close_time: time.default("18:00"),
      slot_interval_minutes: z.coerce.number().int().min(5).max(120).default(10),
      min_notice_hours: z.coerce.number().int().min(0).max(720).default(0),
      max_advance_days: z.coerce.number().int().min(1).max(730).default(180),
      // One flag per weekday, index 0 = Sunday … 6 = Saturday (matches Date.getDay()).
      open_days: z
        .array(z.boolean())
        .length(7)
        .default([false, true, true, true, true, true, true]),
      require_payment: z.boolean().default(false),
      note: text(400).default(""),
    })
    .default({}),

  shop: z
    .object({
      enabled: z.boolean().default(true),
      disabled_message: text(300).default("Our online shop is temporarily unavailable. Please check back soon."),
      free_shipping_threshold: z.coerce.number().min(0).max(100000).default(0),
      shipping_flat_rate: z.coerce.number().min(0).max(100000).default(0),
      low_stock_threshold: z.coerce.number().int().min(0).max(1000).default(5),
      order_note: text(400).default(""),
    })
    .default({}),

  payments: z
    .object({
      card_payments_enabled: z.boolean().default(true),
      accepted_methods_note: text(200).default("Visa, Mastercard, Maestro and PayPal accepted"),
      checkout_note: text(400).default(""),
      show_secure_badge: z.boolean().default(true),
    })
    .default({}),

  seo: z
    .object({
      meta_title: text(70).default("Mayor Beauty Place | Elevate Your Everyday Look"),
      meta_description: text(200).default(
        "Mayor Beauty Place — beauty treatments, consultation, professional ethics and quality products.",
      ),
      og_image_url: imageUrl.default(""),
      allow_indexing: z.boolean().default(true),
    })
    .default({}),

  system: z
    .object({
      maintenance_mode: z.boolean().default(false),
      maintenance_message: text(400).default(
        "We're carrying out a little maintenance and will be back shortly. Thank you for your patience.",
      ),
    })
    .default({}),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

/** Weekday labels, index-aligned with `booking.open_days` (0 = Sunday). */
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DEFAULT_OPEN_DAYS = [false, true, true, true, true, true, true];

export function normaliseOpenDays(days: unknown): boolean[] {
  return Array.isArray(days) && days.length === 7
    ? days.map((d) => d !== false)
    : [...DEFAULT_OPEN_DAYS];
}

/** Weekday indexes the salon is closed on. */
export function closedWeekdays(days: unknown): number[] {
  return normaliseOpenDays(days)
    .map((open, i) => (open ? -1 : i))
    .filter((i) => i >= 0);
}

/** True when a YYYY-MM-DD date falls on an open weekday. */
export function isOpenOnDate(days: unknown, date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return normaliseOpenDays(days)[d.getDay()] === true;
}

/** Fully-populated defaults, used before anything has been saved. */
export const DEFAULT_SETTINGS: SiteSettings = settingsSchema.parse({});

export type SettingsPatch = {
  [K in keyof SiteSettings]?: Partial<SiteSettings[K]>;
};

/** Merges a partial update over the current document, group by group. */
export function mergeSettings(
  current: SiteSettings,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...current };
  for (const [group, value] of Object.entries(patch)) {
    if (!(group in current) || typeof value !== "object" || value === null) continue;
    out[group] = {
      ...(current[group as keyof SiteSettings] as Record<string, unknown>),
      ...(value as Record<string, unknown>),
    };
  }
  return out;
}

export function currencySymbol(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "£";
}

/** Renders `{year}` placeholders in footer copy. */
export function renderCopyright(template: string) {
  return template.replace(/\{year\}/g, String(new Date().getFullYear()));
}

export function addressLines(address: string) {
  return address
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function telHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
}
