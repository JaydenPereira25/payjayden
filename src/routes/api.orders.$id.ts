import { createFileRoute } from '@tanstack/react-router'
import { getUser } from '@netlify/identity'
import { getOrdersStore, type Order, type OrderStatus } from './api.orders'
import { notifyOrderStatus } from '@/lib/notifications.server'

const ADMIN_KEY = 'jaydendelivers2503'

const ALLOWED_STATUSES: OrderStatus[] = [
  'pending',
  'payment_received',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'delayed',
  'cancelled',
]

async function isAdmin(request: Request, body: { adminKey?: string } | null): Promise<boolean> {
  const url = new URL(request.url)
  const fromQuery = url.searchParams.get('adminKey')
  const fromBody = body?.adminKey
  return fromQuery === ADMIN_KEY || fromBody === ADMIN_KEY
}

export const Route = createFileRoute('/api/orders/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const store = await getOrdersStore()
        const order = (await store.get(params.id, { type: 'json' })) as Order | null
        if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

        if (await isAdmin(request, null)) {
          return Response.json(order)
        }

        const user = await getUser()
        if (user && order.userId === user.id) {
          return Response.json(order)
        }

        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      },
      PATCH: async ({ request, params }) => {
        const body = await request.json() as {
          adminKey?: string
          status?: OrderStatus
          deliveryPhoto?: string
          reason?: string
          resumeStatus?: OrderStatus
        }
        if (!(await isAdmin(request, body))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const store = await getOrdersStore()
        const order = (await store.get(params.id, { type: 'json' })) as Order | null
        if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

        let updated: Order = {
          ...order,
          delayReason: order.delayReason ?? null,
          cancelReason: order.cancelReason ?? null,
          preDelayStatus: order.preDelayStatus ?? null,
        }
        let notifyOf: { status: OrderStatus; reason?: string } | null = null

        if (body.status) {
          if (!ALLOWED_STATUSES.includes(body.status)) {
            return Response.json({ error: 'Invalid status' }, { status: 400 })
          }

          const reason = (body.reason ?? '').trim()
          if ((body.status === 'delayed' || body.status === 'cancelled') && !reason) {
            return Response.json({ error: 'A reason is required to delay or cancel an order.' }, { status: 400 })
          }

          const now = new Date().toISOString()

          if (body.status === 'delayed') {
            if (updated.status !== 'delayed' && updated.status !== 'delivered' && updated.status !== 'cancelled') {
              updated.preDelayStatus = updated.status
            }
            updated.delayReason = reason
          } else if (body.status === 'cancelled') {
            updated.cancelReason = reason
          } else if (updated.status === 'delayed') {
            updated.delayReason = null
            updated.preDelayStatus = null
          }

          updated.status = body.status
          updated.statusHistory = [
            ...(updated.statusHistory ?? []),
            reason
              ? { status: body.status, at: now, reason }
              : { status: body.status, at: now },
          ]
          notifyOf = { status: body.status, reason: reason || undefined }
        }

        if (typeof body.deliveryPhoto === 'string') {
          updated.deliveryPhoto = body.deliveryPhoto
        }

        await store.setJSON(params.id, updated)

        if (notifyOf) {
          try {
            await notifyOrderStatus(updated, notifyOf.status, notifyOf.reason)
          } catch (err) {
            console.error('[api.orders] notify failed', err)
          }
        }

        return Response.json(updated)
      },
      DELETE: async ({ request, params }) => {
        let body: { adminKey?: string } | null = null
        try {
          body = await request.json()
        } catch {
          body = null
        }
        if (!(await isAdmin(request, body))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const store = await getOrdersStore()
        await store.delete(params.id)
        return new Response(null, { status: 204 })
      },
    },
  },
})
