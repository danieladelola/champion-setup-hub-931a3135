import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getDb } from "@/lib/db.server";
import {
  createSession,
  json,
  sessionCookie,
  verifyPassword,
} from "@/lib/auth.server";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1),
  remember: z.boolean().optional(),
});

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid request" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return json({ error: "Invalid email or password" }, { status: 400 });
        }
        const { email, password, remember } = parsed.data;
        const sql = getDb();
        const rows = await sql<
          {
            id: string;
            password_hash: string;
            is_active: boolean;
            full_name: string;
            email: string;
            role: string;
          }[]
        >`select id, password_hash, is_active, full_name, email, role
            from admin_users where lower(email) = lower(${email}) limit 1`;
        const user = rows[0];
        if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
          return json({ error: "Invalid email or password" }, { status: 401 });
        }
        const { token, maxAge } = await createSession(user.id, !!remember);
        await sql`update admin_users set last_login = now(), updated_at = now() where id = ${user.id}`;
        return json(
          {
            user: {
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              role: user.role,
            },
          },
          { headers: { "set-cookie": sessionCookie(token, maxAge, request) } },
        );
      },
    },
  },
});
