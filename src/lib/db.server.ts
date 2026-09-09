import postgres from 'postgres'

let sql: ReturnType<typeof postgres> | null = null

export class DbConfigError extends Error {}

function sslOptionFor(url: string) {
  // Managed/self-hosted Postgres behind Coolify often uses a self-signed cert.
  // `sslmode=require` in the URL means "encrypt, don't verify the CA".
  if (/[?&]sslmode=disable/.test(url)) return false
  if (/[?&]sslmode=(require|prefer)/.test(url)) return { rejectUnauthorized: false }
  if (/[?&]sslmode=(verify-ca|verify-full)/.test(url)) return true
  return false
}

export function getDb() {
  if (!sql) {
    const url = process.env['DATABASE_URL']
    if (!url) {
      throw new DbConfigError(
        'DATABASE_URL is not set on the server. Add it to the environment variables of the deployment.',
      )
    }
    sql = postgres(url, {
      max: 5,
      // Close connections immediately after each query: sockets opened during
      // one request cannot be reused by another in the serverless runtime,
      // which otherwise causes intermittent "Cannot perform I/O on behalf of a
      // different request" failures (broken product lists/images).
      idle_timeout: 0,
      connect_timeout: 5,
      prepare: false,
      ssl: sslOptionFor(url),
    })
  }
  return sql
}
