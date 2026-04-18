import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ChevronLeft, Check, Clock, Package, CreditCard, Truck, Home, Image as ImageIcon, ChevronDown, ChevronUp, AlertTriangle, Ban } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { Order, OrderStatus } from '../api.orders'

export const Route = createFileRoute('/orders/$id')({
  component: OrderTrackingPage,
})

const STEPS: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: 'pending', label: 'Order Request Sent', icon: Package },
  { status: 'payment_received', label: 'Order Payment Received', icon: CreditCard },
  { status: 'picked_up', label: 'Order Being Picked Up', icon: Package },
  { status: 'out_for_delivery', label: 'Order Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Order Delivered', icon: Home },
]

function formatEST(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' EST'
}

function OrderTrackingPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: '/orders/$id' })
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate({ to: '/login', search: { redirect: `/orders/${id}` } as never })
      return
    }
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (!res.ok) throw new Error('not_found')
        const data = await res.json()
        setOrder(data as Order)
      } catch {
        setErr('We could not load this order. It may belong to another account.')
      } finally {
        setLoading(false)
      }
    })()

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`)
        if (res.ok) setOrder(await res.json())
      } catch {}
    }, 15000)
    return () => clearInterval(interval)
  }, [id, user, authLoading, navigate])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (err || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <p className="text-gray-600 mb-4">{err || 'Order not found.'}</p>
          <button onClick={() => navigate({ to: '/' })} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const isDelayed = order.status === 'delayed'
  const isCancelled = order.status === 'cancelled'
  const timelineStatus: OrderStatus = isDelayed
    ? (order.preDelayStatus && order.preDelayStatus !== 'delayed' && order.preDelayStatus !== 'cancelled'
        ? order.preDelayStatus
        : 'pending')
    : order.status
  const idx = STEPS.findIndex(s => s.status === timelineStatus)
  const currentIndex = idx < 0 ? 0 : idx
  const byStatus = new Map(order.statusHistory.map(h => [h.status, h.at]))

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate({ to: '/account' })} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">
            Pay<span className="text-blue-600">Jayden</span>
            <span className="text-gray-400 font-normal text-sm ml-2">— Order Tracker</span>
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs text-gray-400">Order #{order.id.slice(-8)}</p>
            <p className="text-2xl font-extrabold text-blue-600">${order.total.toFixed(2)}</p>
          </div>
          <p className="text-sm text-gray-600">
            Placed {formatEST(order.createdAt)}
          </p>
        </div>

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Order Cancelled</p>
                <p className="font-bold text-gray-900 mt-0.5">This order has been cancelled.</p>
                {order.cancelReason && (
                  <p className="text-sm text-red-900 mt-2 leading-relaxed">
                    <strong>Reason:</strong> {order.cancelReason}
                  </p>
                )}
                <p className="text-xs text-red-700 mt-2">
                  We've notified you by email{order.phone ? ' and text' : ''}. If you believe this is a mistake, contact Jayden at 813-797-0007.
                </p>
              </div>
            </div>
          </div>
        )}

        {isDelayed && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Order Delayed</p>
                <p className="font-bold text-gray-900 mt-0.5">Your delivery is running behind.</p>
                {order.delayReason && (
                  <p className="text-sm text-orange-900 mt-2 leading-relaxed">
                    <strong>Reason:</strong> {order.delayReason}
                  </p>
                )}
                <p className="text-xs text-orange-700 mt-2">
                  Hang tight — we'll send another update as soon as we're back on track.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Tracking</h2>
          <p className="text-xs text-gray-400 mb-6">Times shown in EST (New Jersey local time)</p>

          {/* Horizontal bar */}
          <div className="relative">
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-100 rounded-full" />
            <div
              className="absolute left-0 top-5 h-1 bg-blue-600 rounded-full transition-all"
              style={{ width: `${currentIndex === 0 ? 0 : (currentIndex / (STEPS.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {STEPS.map((step, i) => {
                const done = i <= currentIndex
                const active = i === currentIndex
                const Icon = step.icon
                return (
                  <div key={step.status} className="flex flex-col items-center text-center" style={{ width: `${100 / STEPS.length}%` }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
                      done ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-300'
                    } ${active ? 'ring-4 ring-blue-100' : ''}`}>
                      {i < currentIndex ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <p className={`text-[10px] sm:text-xs font-medium mt-2 leading-tight ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current status banner */}
          <div className={`mt-6 border rounded-xl p-4 flex items-center gap-3 ${
            isCancelled ? 'bg-red-50 border-red-100'
            : isDelayed ? 'bg-orange-50 border-orange-100'
            : 'bg-blue-50 border-blue-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-red-600' : isDelayed ? 'bg-orange-500 animate-pulse' : 'bg-blue-600 animate-pulse'}`} />
            <div className="flex-1">
              <p className={`text-xs font-semibold uppercase tracking-wide ${
                isCancelled ? 'text-red-700' : isDelayed ? 'text-orange-700' : 'text-blue-600'
              }`}>Current status</p>
              <p className="font-bold text-gray-900">
                {isCancelled ? 'Cancelled' : isDelayed ? 'Delayed' : (STEPS[currentIndex]?.label ?? 'Order Request Sent')}
              </p>
            </div>
            {byStatus.get(order.status) && (
              <p className="text-xs text-gray-500">{formatEST(byStatus.get(order.status)!)}</p>
            )}
          </div>

          <button
            onClick={() => setShowDetails(v => !v)}
            className="mt-4 w-full flex items-center justify-center gap-1 text-sm text-blue-600 font-medium hover:underline"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide detailed tracking' : 'Detailed tracking'}
          </button>

          {showDetails && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              {STEPS.map((step, i) => {
                const ts = byStatus.get(step.status)
                const done = i <= currentIndex
                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      <p className="text-xs text-gray-500">{ts ? formatEST(ts) : 'Pending'}</p>
                    </div>
                  </div>
                )
              })}
              {order.statusHistory
                .filter(ev => ev.status === 'delayed' || ev.status === 'cancelled')
                .map((ev, i) => (
                  <div key={`extra-${i}`} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      ev.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {ev.status === 'cancelled' ? <Ban className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {ev.status === 'cancelled' ? 'Order Cancelled' : 'Order Delayed'}
                      </p>
                      <p className="text-xs text-gray-500">{formatEST(ev.at)}</p>
                      {ev.reason && <p className="text-xs text-gray-600 italic mt-0.5">{ev.reason}</p>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Delivery photo */}
        {order.deliveryPhoto && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-gray-900">Delivery Photo</h2>
            </div>
            <button onClick={() => setPhotoOpen(true)} className="w-full">
              <img
                src={order.deliveryPhoto}
                alt="Delivered order"
                className="w-full max-h-80 object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity cursor-zoom-in"
              />
            </button>
            <p className="text-xs text-gray-400 mt-2">Tap the photo to enlarge.</p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Order Details</h2>
          <div className="space-y-2 mb-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Delivery</span><span>${order.deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100"><span>Total</span><span className="text-blue-600">${order.total.toFixed(2)}</span></div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-400">Delivery</p>
              <p className="font-medium text-gray-900">{order.deliveryType === 'home' ? order.address : 'Woodcliff Park Pickup'}</p>
            </div>
            <div>
              <p className="text-gray-400">Payment</p>
              <p className="font-medium text-gray-900 capitalize">{order.paymentMethod.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {photoOpen && order.deliveryPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPhotoOpen(false)}>
          <img src={order.deliveryPhoto} alt="Delivered" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
