import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and dashes"),
  description: z.string().max(5000).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  image_url: z.string().max(1000).optional().nullable(),
  gallery_images: z.array(z.string().max(1000)).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export type Product = ProductInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
