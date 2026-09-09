import { z } from "zod";

export const transformationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  before_image_url: z.string().trim().min(1, "Before image is required").max(1000),
  after_image_url: z.string().trim().min(1, "After image is required").max(1000),
  sort_order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export type TransformationInput = z.infer<typeof transformationSchema>;
