import { z } from "zod";

export const AD_PLACEMENTS = [
  { value: "home_after_hero", label: "Homepage — after hero section" },
  { value: "home_mid", label: "Homepage — middle sections" },
  { value: "home_bottom", label: "Homepage — bottom" },
  { value: "shop_top", label: "Shop — top of product list" },
  { value: "shop_bottom", label: "Shop — bottom of product list" },
  { value: "product_page", label: "Product detail page" },
  { value: "cart", label: "Cart page" },
  { value: "checkout", label: "Checkout page" },
  { value: "booking_top", label: "Booking page — top" },
  { value: "booking_bottom", label: "Booking page — bottom" },
  { value: "gallery", label: "Before & After / gallery page" },
  { value: "about", label: "About page" },
  { value: "contact", label: "Contact page" },
  { value: "sitewide_footer", label: "Site-wide — above footer" },
] as const;

export const AD_PLACEMENT_VALUES = AD_PLACEMENTS.map((p) => p.value);

export const AD_DISPLAY_TYPES = [
  { value: "embed", label: "Embedded banner (inside the page)" },
  { value: "popup", label: "Popup (opens over the page)" },
] as const;

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Invalid date");

export const adSchema = z.object({
  title: z.string().trim().max(200).default(""),
  image_url: z.string().trim().min(1, "Ad image is required").max(1000),
  link_url: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  placement: z.enum(AD_PLACEMENT_VALUES as [string, ...string[]]),
  display_type: z.enum(["embed", "popup"]).default("embed"),
  starts_at: optionalDate,
  ends_at: optionalDate,
  popup_delay_seconds: z.coerce.number().int().min(0).max(120).default(3),
  sort_order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});


export type AdInput = z.infer<typeof adSchema>;
