import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ChevronLeft, Package, LogOut, User as UserIcon, ChevronRight, Clock } from 'lucide-react'
import { logout } from '@netlify/identity'
import { useAuth } from '@/lib/auth'
import type { Order, OrderStatus } from './api.orders'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Request Sent',
  payment_received: 'Payment Received',
  picked_up: 'Being Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  payment_received: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  delayed: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

function AccountPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate({ to: '/login', search: { redirect: '/account' } as never })
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/orders?mine=1')
        if (res.ok) setOrders(await res.json())
      } catch {
        setOrders([])
      } finally {
        setLoadingOrders(false)
      }
    })()
  }, [user, loading, navigate])

  async function handleLogout() {
    await logout()
    navigate({ to: '/' })
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate({ to: '/' })} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-bold text-gray-900">
              Pay<span className="text-blue-600">Jayden</span>
              <span className="text-gray-400 font-normal text-sm ml-2">— My Account</span>
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-gray-900">{user.name || user.email}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 px-1">Your Orders</h2>
          {loadingOrders ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No orders yet</p>
              <button onClick={() => navigate({ to: '/' })} className="mt-4 text-blue-600 text-sm hover:underline">
                Start shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => navigate({ to: '/orders/$id', params: { id: order.id } })}
                  className="w-full bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">#{order.id.slice(-8)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} EST
                    </p>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold text-blue-600">${order.total.toFixed(2)}</p>
                    <ChevronRight className="w-5 h-5 text-gray-300 ml-auto mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
