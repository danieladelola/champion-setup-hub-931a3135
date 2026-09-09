import { createFileRoute } from '@tanstack/react-router'

/**
 * Dependency-free liveness probe. Never touches the database so container
 * healthchecks cannot hang when Postgres is slow or unreachable.
 */
export const Route = createFileRoute('/api/public/live')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    },
  },
})
