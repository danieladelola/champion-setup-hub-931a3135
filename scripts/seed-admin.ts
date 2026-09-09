/**
 * One-off script: create (or reset) an admin user.
 *
 * Usage:
 *   DATABASE_URL="postgres://…" bun scripts/seed-admin.ts "admin@example.com" "StrongPassword" "Full Name"
 */
import postgres from "postgres";
import { scrypt } from "@noble/hashes/scrypt.js";
import { bytesToHex, randomBytes } from "@noble/hashes/utils.js";

const SCRYPT_PARAMS = { N: 2 ** 14, r: 8, p: 1, dkLen: 32 };

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const dk = scrypt(new TextEncoder().encode(password), salt, SCRYPT_PARAMS);
  return `scrypt$${bytesToHex(salt)}$${bytesToHex(dk)}`;
}

const [email, password, fullName = "Administrator"] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: bun scripts/seed-admin.ts "email" "password" ["Full Name"]');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
const hash = hashPassword(password);

const rows = await sql`
  insert into admin_users (full_name, email, password_hash, role, is_active)
  values (${fullName}, ${email.toLowerCase()}, ${hash}, 'admin', true)
  on conflict (email) do update
    set password_hash = excluded.password_hash,
        full_name = excluded.full_name,
        is_active = true,
        updated_at = now()
  returning id, email, full_name, role`;

console.log("Admin ready:", rows[0]);
await sql.end();
