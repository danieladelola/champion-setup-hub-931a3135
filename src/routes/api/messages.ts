import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

const messageSchema = z.object({
  full_name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Please enter a message").max(4000),
});

export const Route = createFileRoute("/api/messages")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = messageSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            { error: parsed.error.issues[0]?.message ?? "Invalid message" },
            { status: 400 },
          );
        }
        const m = parsed.data;
        try {
          const sql = getDb();
          const rows = await sql`
            insert into messages (full_name, email, phone, subject, message, read)
            values (${m.full_name}, ${m.email.toLowerCase()}, ${m.phone || null},
              ${m.subject || null}, ${m.message}, false)
            returning id, created_at`;
          await sql`
            insert into customers (full_name, email, phone, source)
            values (${m.full_name}, ${m.email.toLowerCase()}, ${m.phone || null}, 'contact')
            on conflict (lower(email)) do update set
              full_name = coalesce(customers.full_name, excluded.full_name),
              phone = coalesce(customers.phone, excluded.phone)`;
          return json({ message: rows[0] }, { status: 201 });
        } catch (error) {
          console.error("POST /api/messages failed", error);
          return json({ error: "Could not send your message" }, { status: 500 });
        }
      },
    },
  },
});
