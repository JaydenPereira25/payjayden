import { createFileRoute } from '@tanstack/react-router'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'
import { hasAdminSessionFromRequest } from '@/lib/admin-auth'
import { notifyOrderStatus } from '@/lib/notifications.server'

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export type OrderStatus =
  | 'pending'
  | 'payment_received'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed'
  | 'cancelled'

export interface OrderStatusEvent {
  status: OrderStatus
  at: string
  reason?: string
}

export interface Order {
  id: string
  createdAt: string
  customerName: string
  email: string
  phone: string
  address: string
  deliveryType: 'pickup' | 'home'
  agreedToTerms: boolean
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: 'cash' | 'apple_cash' | 'venmo' | 'zelle'
  signature: string
  status: OrderStatus
  statusHistory: OrderStatusEvent[]
  userId: string | null
  userEmail: string | null
  deliveryPhoto: string | null
  delayReason: string | null
  cancelReason: string | null
  preDelayStatus: OrderStatus | null
}

export async function getOrdersStore() {
  return getStore({ name: 'payjayden-orders', consistency: 'strong' })
}

export const Route = createFileRoute('/api/orders')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const mine = url.searchParams.get('mine')
        const user = await getUser()

        const store = await getOrdersStore()

        if (mine) {
          if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
          const { blobs } = await store.list()
          const orders: Order[] = []
          for (const blob of blobs) {
            const order = await store.get(blob.key, { type: 'json' })
            if (order && (order as Order).userId === user.id) {
              orders.push(order as Order)
            }
          }
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          return Response.json(orders)
        }

        if (!hasAdminSessionFromRequest(request)) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { blobs } = await store.list()
        const orders: Order[] = []
        for (const blob of blobs) {
          const order = await store.get(blob.key, { type: 'json' })
          if (order) orders.push(order as Order)
        }
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return Response.json(orders)

      },
      POST: async ({ request }) => {
        const body = await request.json() as Omit<Order, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'userId' | 'userEmail' | 'deliveryPhoto' | 'delayReason' | 'cancelReason' | 'preDelayStatus'>

        let userId: string | null = null
        let userEmail: string | null = null
        try {
          const user = await getUser()
          if (user) {
            userId = user.id
            userEmail = user.email ?? null
          }
        } catch {
          // guest order
        }

        const now = new Date().toISOString()
        const order: Order = {
          ...body,
          id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: now,
          status: 'pending',
          statusHistory: [{ status: 'pending', at: now }],
          userId,
          userEmail,
          deliveryPhoto: null,
          delayReason: null,
          cancelReason: null,
          preDelayStatus: null,
        }
        const store = await getOrdersStore()
        await store.setJSON(order.id, order)

        try {
          await notifyOrderStatus(order, 'pending')
        } catch (err) {
          console.error('[api.orders] notify failed', err)
        }

        return Response.json({ orderId: order.id }, { status: 201 })
      },
    },
  },
})
