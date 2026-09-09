import { createFileRoute } from "@tanstack/react-router";

import { getAdminFromRequest, json } from "@/lib/auth.server";
import { getDb } from "@/lib/db.server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await getAdminFromRequest(request);
        if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ error: "Invalid upload" }, { status: 400 });
        }

        const file = form.get("file");
        if (!(file instanceof File)) {
          return json({ error: "No file provided" }, { status: 400 });
        }
        if (!ALLOWED.has(file.type)) {
          return json({ error: "Only JPEG, PNG, WebP, GIF or AVIF images are allowed" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
          return json({ error: "Image must be 5MB or smaller" }, { status: 400 });
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const filename = file.name.slice(0, 200) || "upload";
        const sql = getDb();
        const rows = await sql<{ id: string }[]>`
          insert into media (filename, content_type, byte_size, data, uploaded_by)
          values (${filename}, ${file.type}, ${bytes.byteLength}, ${bytes}, ${admin.id})
          returning id`;

        return json({ url: `/api/media/${rows[0]!.id}`, filename });
      },
    },
  },
});
