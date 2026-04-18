import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Package, ShoppingBag, Trash2, Plus, Edit2, Check, X, Truck, MapPin, Clock, RefreshCw, CreditCard, Camera, CheckCircle2, Upload, AlertTriangle, Ban, PlayCircle } from 'lucide-react'
import type { Order, OrderStatus } from './api.orders'
import type { Product } from './api.products'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

const ADMIN_KEY = 'jaydendelivers2503'

type AdminTab = 'new' | 'in_progress' | 'successful' | 'attention' | 'products'

function AdminPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('new')
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  async function fetchOrders() {
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/orders?adminKey=${ADMIN_KEY}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  async function fetchProducts() {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const newOrders = orders.filter(o => o.status === 'pending' || o.status === 'payment_received')
  const inProgressOrders = orders.filter(o => o.status === 'picked_up' || o.status === 'out_for_delivery')
  const successfulOrders = orders.filter(o => o.status === 'delivered')
  const attentionOrders = orders.filter(o => o.status === 'delayed' || o.status === 'cancelled')

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate({ to: '/' })} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-bold text-gray-900">
              Pay<span className="text-blue-600">Jayden</span>
              <span className="text-amber-500 font-semibold text-sm ml-2">Admin Panel</span>
            </span>
          </div>
          <button
            onClick={tab === 'products' ? fetchProducts : fetchOrders}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 py-3 overflow-x-auto">
            <TabButton active={tab === 'new'} onClick={() => setTab('new')} icon={ShoppingBag} label="New Orders" count={newOrders.length} />
            <TabButton active={tab === 'in_progress'} onClick={() => setTab('in_progress')} icon={Truck} label="In Progress" count={inProgressOrders.length} />
            <TabButton active={tab === 'successful'} onClick={() => setTab('successful')} icon={CheckCircle2} label="Successful" count={successfulOrders.length} />
            <TabButton active={tab === 'attention'} onClick={() => setTab('attention')} icon={AlertTriangle} label="Delayed / Cancelled" count={attentionOrders.length} />
            <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={Package} label="Products" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'new' && <OrdersTab orders={newOrders} loading={loadingOrders} onRefresh={fetchOrders} kind="new" />}
        {tab === 'in_progress' && <OrdersTab orders={inProgressOrders} loading={loadingOrders} onRefresh={fetchOrders} kind="in_progress" />}
        {tab === 'successful' && <OrdersTab orders={successfulOrders} loading={loadingOrders} onRefresh={fetchOrders} kind="successful" />}
        {tab === 'attention' && <OrdersTab orders={attentionOrders} loading={loadingOrders} onRefresh={fetchOrders} kind="attention" />}
        {tab === 'products' && <ProductsTab products={products} loading={loadingProducts} onRefresh={fetchProducts} />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Check; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function OrdersTab({ orders, loading, onRefresh, kind }: { orders: Order[]; loading: boolean; onRefresh: () => void; kind: 'new' | 'in_progress' | 'successful' | 'attention' }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    const emptyMsg = kind === 'new'
      ? 'No new orders.'
      : kind === 'in_progress'
      ? 'No orders in progress.'
      : kind === 'successful'
      ? 'No completed orders yet.'
      : 'No delayed or cancelled orders.'
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">{emptyMsg}</p>
        <button onClick={onRefresh} className="mt-4 text-blue-600 text-sm hover:underline flex items-center gap-1 mx-auto">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onUpdate={onRefresh} />
      ))}
    </div>
  )
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash (USD)',
  apple_cash: 'Apple Cash',
  venmo: 'Venmo',
  zelle: 'Zelle®',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Request Sent',
  payment_received: 'Payment Received',
  picked_up: 'Being Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  payment_received: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  delayed: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [busy, setBusy] = useState(false)
  const [confirmDismiss, setConfirmDismiss] = useState(false)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [reasonModal, setReasonModal] = useState<null | 'delay' | 'cancel'>(null)

  async function patch(payload: Record<string, unknown>) {
    setBusy(true)
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: ADMIN_KEY, ...payload }),
      })
      onUpdate()
    } finally {
      setBusy(false)
    }
  }

  async function dismiss() {
    setBusy(true)
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: ADMIN_KEY }),
      })
      onUpdate()
    } finally {
      setBusy(false)
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' EST'
  }

  const actions = (() => {
    switch (order.status) {
      case 'pending':
        return [
          { label: 'Order Payment Received', icon: CreditCard, onClick: () => patch({ status: 'payment_received' }), style: 'bg-blue-600 hover:bg-blue-700 text-white' },
        ]
      case 'payment_received':
        return [
          { label: 'Order Being Picked Up', icon: Package, onClick: () => patch({ status: 'picked_up' }), style: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
        ]
      case 'picked_up':
        return [
          { label: 'Order Picked Up', icon: Truck, onClick: () => patch({ status: 'out_for_delivery' }), style: 'bg-purple-600 hover:bg-purple-700 text-white' },
        ]
      case 'out_for_delivery':
        return [
          { label: 'Order Complete', icon: CheckCircle2, onClick: () => setPhotoModalOpen(true), style: 'bg-green-600 hover:bg-green-700 text-white' },
        ]
      case 'delayed': {
        const resumeTo: OrderStatus = order.preDelayStatus && order.preDelayStatus !== 'delayed' && order.preDelayStatus !== 'cancelled'
          ? order.preDelayStatus
          : 'payment_received'
        return [
          {
            label: `Resume (${STATUS_LABELS[resumeTo]})`,
            icon: PlayCircle,
            onClick: () => patch({ status: resumeTo }),
            style: 'bg-blue-600 hover:bg-blue-700 text-white',
          },
        ]
      }
      default:
        return []
    }
  })()

  const canDelay = order.status === 'pending' || order.status === 'payment_received' || order.status === 'picked_up' || order.status === 'out_for_delivery'
  const canCancel = canDelay || order.status === 'delayed'

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 border-b border-gray-50">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-gray-900 text-lg">{order.customerName}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
            {order.userId ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Account</span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Guest</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(order.createdAt)}
            </span>
            <span>#{order.id.slice(-8)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-blue-600">${order.total.toFixed(2)}</p>
          <p className="text-xs text-gray-400">incl. ${order.deliveryFee} delivery</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-50">
        <div className="p-5 space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Customer Info</p>
          <InfoRow label="Email" value={order.email} />
          <InfoRow label="Phone" value={order.phone} />
          <InfoRow label="Payment" value={PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod} />
          <InfoRow label="Agreed to T&C" value={order.agreedToTerms ? '✓ Yes' : '✗ No'} />
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-24 shrink-0 mt-0.5">Delivery</span>
            <div>
              {order.deliveryType === 'pickup' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                  <MapPin className="w-3 h-3" /> Woodcliff Park Pickup (+$5)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                  <Truck className="w-3 h-3" /> Home Delivery (+$10)
                </span>
              )}
              {order.deliveryType === 'home' && order.address && (
                <p className="text-sm text-gray-700 mt-1 font-medium">{order.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Items Ordered</p>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-gray-400 text-xs ml-2">×{item.quantity}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Delivery</span>
              <span>${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-sm pt-1">
              <span>Total Owed</span>
              <span className="text-blue-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.statusHistory && order.statusHistory.length > 1 && (
        <div className="px-5 pb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Timeline (EST)</p>
          <div className="flex flex-wrap gap-2">
            {order.statusHistory.map((ev, i) => (
              <span key={i} className="text-xs bg-gray-50 text-gray-600 rounded-full px-2.5 py-1">
                <strong className="text-gray-800">{STATUS_LABELS[ev.status]}</strong> — {formatTime(ev.at)}
                {ev.reason ? <span className="text-gray-500 italic ml-1">— {ev.reason}</span> : null}
              </span>
            ))}
          </div>
        </div>
      )}

      {order.status === 'delayed' && order.delayReason && (
        <div className="px-5 pb-3">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Delay Reason</p>
              <p className="text-sm text-orange-900">{order.delayReason}</p>
            </div>
          </div>
        </div>
      )}

      {order.status === 'cancelled' && order.cancelReason && (
        <div className="px-5 pb-3">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
            <Ban className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Cancel Reason</p>
              <p className="text-sm text-red-900">{order.cancelReason}</p>
            </div>
          </div>
        </div>
      )}

      {order.signature && (
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer Signature</p>
          <img src={order.signature} alt="Signature" className="max-w-[200px] border border-gray-100 rounded-lg bg-gray-50" />
        </div>
      )}

      {order.deliveryPhoto && (
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Delivery Photo</p>
          <img src={order.deliveryPhoto} alt="Delivered" className="max-w-[260px] border border-gray-100 rounded-lg" />
        </div>
      )}

      {/* Actions */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="px-5 pb-5 flex flex-wrap gap-2 pt-2 border-t border-gray-50">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              disabled={busy}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${a.style}`}
            >
              <a.icon className="w-4 h-4" />
              {a.label}
            </button>
          ))}

          {canDelay && order.status !== 'delayed' && (
            <button
              onClick={() => setReasonModal('delay')}
              disabled={busy}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Delay Order
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setReasonModal('cancel')}
              disabled={busy}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              Cancel Order
            </button>
          )}

          {order.status === 'pending' || order.status === 'payment_received' ? (
            confirmDismiss ? (
              <div className="flex items-center gap-1">
                <button onClick={dismiss} disabled={busy} className="flex items-center gap-1 text-sm font-semibold px-3 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> Confirm Dismiss
                </button>
                <button onClick={() => setConfirmDismiss(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDismiss(true)}
                disabled={busy}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                title="Permanently delete this order without notifying the customer"
              >
                <Trash2 className="w-4 h-4" />
                Dismiss Order
              </button>
            )
          ) : null}
        </div>
      )}

      {photoModalOpen && (
        <OrderCompleteModal
          onClose={() => { setPhotoModalOpen(false); setPhotoDataUrl(null) }}
          photoDataUrl={photoDataUrl}
          setPhotoDataUrl={setPhotoDataUrl}
          onSubmit={async () => {
            if (!photoDataUrl) return
            await patch({ status: 'delivered', deliveryPhoto: photoDataUrl })
            setPhotoModalOpen(false)
            setPhotoDataUrl(null)
          }}
          busy={busy}
        />
      )}

      {reasonModal && (
        <ReasonModal
          mode={reasonModal}
          busy={busy}
          onClose={() => setReasonModal(null)}
          onSubmit={async (reason) => {
            await patch({ status: reasonModal === 'delay' ? 'delayed' : 'cancelled', reason })
            setReasonModal(null)
          }}
        />
      )}
    </div>
  )
}

function ReasonModal({ mode, busy, onClose, onSubmit }: {
  mode: 'delay' | 'cancel'
  busy: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')

  const isDelay = mode === 'delay'

  const presets = isDelay
    ? [
        'Store was out of a requested item.',
        'Heavy traffic / weather impacting delivery.',
        'Pickup point is running behind schedule.',
        'Payment confirmation taking longer than usual.',
      ]
    : [
        'Customer requested cancellation.',
        'Payment could not be verified.',
        'Requested items are no longer available.',
        'Delivery address is out of our service area.',
      ]

  function submit() {
    const clean = reason.trim()
    if (clean.length < 4) {
      setErr('Please provide a clear reason (at least 4 characters).')
      return
    }
    setErr('')
    onSubmit(clean)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className={`font-bold text-gray-900 flex items-center gap-2`}>
            {isDelay ? <AlertTriangle className="w-5 h-5 text-orange-600" /> : <Ban className="w-5 h-5 text-red-600" />}
            {isDelay ? 'Delay Order' : 'Cancel Order'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            {isDelay
              ? 'Tell the customer why their order is being delayed. They will receive a status update by email and text.'
              : 'Tell the customer why the order is being cancelled. They will receive a status update by email and text. This cannot be undone.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason *</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isDelay ? 'e.g. Store was out of a requested item' : 'e.g. Payment could not be verified'}
            />
            {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Quick pick</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(p)}
                  className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={busy}
              className={`flex-1 font-semibold py-2.5 rounded-xl text-white disabled:opacity-50 ${
                isDelay ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {busy ? 'Saving…' : isDelay ? 'Mark as Delayed' : 'Cancel Order'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCompleteModal({ onClose, photoDataUrl, setPhotoDataUrl, onSubmit, busy }: {
  onClose: () => void
  photoDataUrl: string | null
  setPhotoDataUrl: (s: string | null) => void
  onSubmit: () => void
  busy: boolean
}) {
  const fileInput = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 1024
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" />
            Photo of Delivered Order
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Before we mark this order as delivered, please take a photo of the order and its contents.
          </p>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {photoDataUrl ? (
            <div>
              <img src={photoDataUrl} alt="Preview" className="w-full max-h-60 object-cover rounded-xl border border-gray-100" />
              <button onClick={() => fileInput.current?.click()} className="mt-2 text-sm text-blue-600 hover:underline">
                Retake photo
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInput.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-700">Upload or take a photo</p>
              <p className="text-xs text-gray-400">Tap to open camera or choose a file</p>
            </button>
          )}

          <button
            onClick={onSubmit}
            disabled={!photoDataUrl || busy}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {busy ? 'Submitting…' : 'Submit & Mark as Delivered'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium break-all">{value}</span>
    </div>
  )
}

function ProductsTab({ products, loading, onRefresh }: { products: Product[]; loading: boolean; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Product>>({})
  const [newForm, setNewForm] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '/placeholder.png', available: true })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function startEdit(product: Product) {
    setEditingId(product.id)
    setEditForm({ ...product })
    setAddingNew(false)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: editForm, adminKey: ADMIN_KEY }),
      })
      setEditingId(null)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(id: string) {
    setSaving(true)
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: ADMIN_KEY }),
      })
      setDeleteConfirm(null)
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  async function addProduct() {
    if (!newForm.name || !newForm.price) return
    setSaving(true)
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: newForm, adminKey: ADMIN_KEY }),
      })
      setAddingNew(false)
      setNewForm({ name: '', description: '', price: 0, image: '/placeholder.png', available: true })
      onRefresh()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
            <div className="aspect-video bg-gray-100 rounded-xl mb-4" />
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setAddingNew(true); setEditingId(null) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {addingNew && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            New Product
          </h3>
          <ProductForm form={newForm} onChange={setNewForm} />
          <div className="flex gap-2 mt-4">
            <button onClick={addProduct} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Add Product'}
            </button>
            <button onClick={() => setAddingNew(false)} className="text-gray-500 hover:bg-gray-100 text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {editingId === product.id ? (
              <div className="p-5">
                <ProductForm form={editForm} onChange={setEditForm} />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => saveEdit(product.id)} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:bg-gray-100 text-sm px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-video overflow-hidden bg-gray-50">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <span className="text-blue-600 font-bold text-sm whitespace-nowrap">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.available ? 'Available' : 'Hidden'}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <button onClick={() => startEdit(product)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteProduct(product.id)} disabled={saving} className="p-1.5 bg-red-500 text-white rounded-lg text-xs font-medium">
                            Delete
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductForm({ form, onChange }: { form: Partial<Product>; onChange: (f: Partial<Product>) => void }) {
  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
        <input className={inputClass} value={form.name || ''} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="e.g. Chips & Snacks Bundle" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea className={inputClass + ' resize-none'} rows={2} value={form.description || ''} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="Short product description" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Price (USD) *</label>
        <input className={inputClass} type="number" step="0.01" min="0" value={form.price || ''} onChange={e => onChange({ ...form, price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
        <input className={inputClass} value={form.image || ''} onChange={e => onChange({ ...form, image: e.target.value })} placeholder="https://... or /placeholder.png" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.available ?? true} onChange={e => onChange({ ...form, available: e.target.checked })} className="accent-blue-600 w-4 h-4" />
        <span className="text-xs font-medium text-gray-600">Available for purchase</span>
      </label>
    </div>
  )
}
