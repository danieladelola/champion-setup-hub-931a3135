import { createFileRoute } from '@tanstack/react-router'

import { getDb } from '@/lib/db.server'

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        const body: Record<string, unknown> = {
          status: 'ok',
          time: new Date().toISOString(),
          database_url_set: Boolean(process.env['DATABASE_URL']),
        }
        try {
          const sql = getDb()
          const rows = await Promise.race([
            sql`select count(*)::int as count from products where active = true`,
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error('Database did not respond within 5s (unreachable, blocked port, or wrong host).')),
                5000,
              ),
            ),
          ])
          body['database'] = 'connected'
          body['active_products'] = rows[0]?.['count'] ?? 0
        } catch (error) {
          body['status'] = 'degraded'
          body['database'] = 'error'
          body['database_error'] = error instanceof Error ? error.message : String(error)
        }
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      },
    },
  },
})
