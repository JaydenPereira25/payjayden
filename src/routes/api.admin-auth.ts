import { createFileRoute } from '@tanstack/react-router'
import {
  buildAdminSessionCookie,
  clearAdminSessionCookie,
  hasAdminSessionFromRequest,
  isValidAdminPassword,
} from '@/lib/admin-auth'

export const Route = createFileRoute('/api/admin-auth')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.json({ authorized: hasAdminSessionFromRequest(request) })
      },
      POST: async ({ request }) => {
        let password = ''
        try {
          const body = await request.json() as { password?: unknown }
          password = typeof body.password === 'string' ? body.password : ''
        } catch {
          return Response.json({ error: 'Invalid request body' }, { status: 400 })
        }

        if (!isValidAdminPassword(password)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return new Response(JSON.stringify({ authorized: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': buildAdminSessionCookie(),
          },
        })
      },
      DELETE: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'Set-Cookie': clearAdminSessionCookie(),
          },
        })
      },
    },
  },
})
