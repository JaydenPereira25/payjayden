import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, X, Check, DollarSign, UserCheck, User as UserIcon, Package } from 'lucide-react'
import { getCart, type CartItem } from './index'
import { useAuth } from '@/lib/auth'
import type { CustomerProfile } from './api.profile'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
  validateSearch: (s: Record<string, unknown>) => ({
    guest: s.guest === true || s.guest === 'true',
  }),
})

const DELIVERY_FEE_PICKUP = 5
const DELIVERY_FEE_HOME = 10

type PaymentMethod = 'cash' | 'apple_cash' | 'venmo' | 'zelle'

function SignatureCanvas({ onSave }: { onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: MouseEvent | Touch, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: ((e instanceof MouseEvent ? e.clientX : e.clientX) - rect.left) * scaleX,
      y: ((e instanceof MouseEvent ? e.clientY : e.clientY) - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    isDrawing.current = true
    const touch = 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
    lastPos.current = getPos(touch as Touch | MouseEvent, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const touch = 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
    const pos = getPos(touch as Touch | MouseEvent, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  function stopDraw() {
    if (isDrawing.current) {
      isDrawing.current = false
      onSave(canvasRef.current!.toDataURL())
    }
  }

  function clear() {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onSave('')
  }

  return (
    <div>
      <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="w-full cursor-crosshair block"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 border-b border-gray-300 w-3/4 pointer-events-none" />
        <p className="absolute bottom-3 right-3 text-xs text-gray-300 pointer-events-none">Sign above</p>
      </div>
      <button type="button" onClick={clear} className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
        Clear signature
      </button>
    </div>
  )
}

function VenmoModal({ total, onClose, onPaid }: { total: number; onClose: () => void; onPaid: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#008CFF' }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="p-8 text-center text-white">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white rounded-xl px-5 py-2">
              <span className="text-2xl font-extrabold" style={{ color: '#008CFF', fontFamily: 'Inter, sans-serif' }}>venmo</span>
            </div>
          </div>
          <p className="text-blue-100 text-sm font-medium mb-2">Send payment to</p>
          <p className="text-3xl font-extrabold mb-1 tracking-tight">@Jaydenp25</p>
          <p className="text-blue-200 text-sm mb-6">on Venmo</p>
          <div className="bg-white/20 rounded-xl p-4 mb-6">
            <p className="text-blue-100 text-xs mb-1">Total Amount Due</p>
            <p className="text-4xl font-extrabold">${total.toFixed(2)}</p>
            <p className="text-blue-100 text-xs mt-1">includes delivery fee</p>
          </div>
          <button
            onClick={onPaid}
            className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors text-lg"
          >
            ✓ Paid the Exact Amount
          </button>
          <button onClick={onClose} className="mt-3 text-white/60 hover:text-white text-sm underline w-full">
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  )
}

function ZelleModal({ total, onClose, onPaid }: { total: number; onClose: () => void; onPaid: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#6D1ED4' }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="p-8 text-center text-white">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white rounded-xl px-5 py-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#6D1ED4' }}>
                <span className="text-white font-black text-sm">Z</span>
              </div>
              <span className="text-2xl font-extrabold" style={{ color: '#6D1ED4' }}>Zelle<sup className="text-sm">®</sup></span>
            </div>
          </div>
          <p className="text-purple-200 text-sm font-medium mb-2">Send payment to</p>
          <p className="text-3xl font-extrabold mb-1 tracking-tight">(813) 797-0007</p>
          <p className="text-purple-200 text-sm mb-6">US phone number</p>
          <div className="bg-white/20 rounded-xl p-4 mb-6">
            <p className="text-purple-200 text-xs mb-1">Total Amount Due</p>
            <p className="text-4xl font-extrabold">${total.toFixed(2)}</p>
            <p className="text-purple-200 text-xs mt-1">includes delivery fee</p>
          </div>
          <button
            onClick={onPaid}
            className="w-full bg-white font-bold py-3 rounded-xl hover:bg-purple-50 transition-colors text-lg"
            style={{ color: '#6D1ED4' }}
          >
            ✓ Paid the Exact Amount
          </button>
          <button onClick={onClose} className="mt-3 text-white/60 hover:text-white text-sm underline w-full">
            Cancel Payment
          </button>
        </div>
      </div>
    </div>
  )
}

function AuthGate({ onGuest }: { onGuest: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white font-inter">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate({ to: '/' })} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">
            Pay<span className="text-blue-600">Jayden</span>
            <span className="text-gray-400 font-normal text-sm ml-2">— Checkout</span>
          </span>
        </div>
      </header>
      <div className="max-w-md mx-auto px-4 pt-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ready to Checkout?</h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Log in to save your info for faster future checkouts and track your order status in real time.
          </p>
          <button
            onClick={() => navigate({ to: '/login', search: { redirect: '/checkout' } as never })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
          >
            Log In or Sign Up
          </button>
          <button
            onClick={onGuest}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors"
          >
            Continue as Guest
          </button>
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Heads up:</strong> Guest orders cannot be tracked on this site. Jayden will text order status
              updates manually from <strong>813-797-0007</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const search = useSearch({ from: '/checkout' })
  const [cart, setCartState] = useState<CartItem[]>([])
  const [step, setStep] = useState<'form' | 'confirmation'>('form')
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [placedAsUser, setPlacedAsUser] = useState<boolean>(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'home'>('home')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [signature, setSignature] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const [showVenmo, setShowVenmo] = useState(false)
  const [showZelle, setShowZelle] = useState(false)

  useEffect(() => {
    setCartState(getCart())
  }, [])

  useEffect(() => {
    if (!user) { setProfileLoaded(true); return }
    ;(async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const p = await res.json() as CustomerProfile | null
          setProfile(p)
          if (p) {
            setName(prev => prev || p.name)
            setPhone(prev => prev || p.phone)
            setAddress(prev => prev || p.address)
          }
          setEmail(prev => prev || user.email || '')
          if (!p?.name && user.name) setName(prev => prev || user.name || '')
        }
      } catch {}
      finally { setProfileLoaded(true) }
    })()
  }, [user])

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const deliveryFee = deliveryType === 'pickup' ? DELIVERY_FEE_PICKUP : DELIVERY_FEE_HOME
  const total = subtotal + deliveryFee

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Full name is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email is required'
    if (!phone.trim()) e.phone = 'Phone number is required'
    if (deliveryType === 'home' && !address.trim()) e.address = 'Home address is required'
    if (!agreedToTerms) e.terms = 'You must agree to the terms and conditions'
    if (!signature) e.signature = 'Please provide your signature'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submitOrder() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const orderData = {
        customerName: name,
        email,
        phone,
        address: deliveryType === 'home' ? address : 'Woodcliff Park (Pickup)',
        deliveryType,
        agreedToTerms,
        items: cart.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        signature,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      if (!res.ok) throw new Error('Failed to submit order')
      const data = await res.json() as { orderId: string }

      if (user) {
        try {
          await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              phone,
              address: deliveryType === 'home' ? address : (profile?.address ?? ''),
            }),
          })
        } catch {}
      }

      localStorage.removeItem('payjayden-cart')
      setPlacedOrderId(data.orderId)
      setPlacedAsUser(!!user)
      setStep('confirmation')
    } catch {
      setErrors({ submit: 'Failed to submit order. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function handlePlaceOrder() {
    if (!validate()) return
    if (paymentMethod === 'venmo') {
      setShowVenmo(true)
    } else if (paymentMethod === 'zelle') {
      setShowZelle(true)
    } else {
      submitOrder()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user && !search.guest && step !== 'confirmation') {
    return <AuthGate onGuest={() => navigate({ to: '/checkout', search: { guest: true } as never })} />
  }

  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className="min-h-screen bg-white font-inter flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-400 text-lg mb-4">Your cart is empty.</p>
          <button onClick={() => navigate({ to: '/' })} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700">
            Shop Now
          </button>
        </div>
      </div>
    )
  }

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white font-inter flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Order Received!</h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            Your payment is being reviewed. Once confirmed, your order will be picked up and delivered <strong>today or the next following day</strong> if no delay permits.
          </p>
          {placedAsUser && placedOrderId ? (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Track Your Order</p>
              <p className="text-sm text-gray-600 mb-3">
                You can follow your order live from Order Request Sent all the way to Delivered.
              </p>
              <button
                onClick={() => navigate({ to: '/orders/$id', params: { id: placedOrderId } })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Track This Order
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">What's Next</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Since you checked out as a guest, you won't be able to track the order on this site. Jayden will text status updates manually from <strong>813-797-0007</strong>.
              </p>
            </div>
          )}
          <button onClick={() => navigate({ to: '/' })} className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors">
            Back to Shop
          </button>
        </div>
      </div>
    )
  }

  const inputClass = (field: string) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`

  const hasSavedProfile = !!(user && profile && profile.name && profile.phone)

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate({ to: '/' })} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">
            Pay<span className="text-blue-600">Jayden</span>
            <span className="text-gray-400 font-normal text-sm ml-2">— Checkout</span>
          </span>
          {user && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <UserIcon className="w-3.5 h-3.5" />
              {user.name || user.email}
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {user && hasSavedProfile && profileLoaded && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-gray-900">Your info is pre-filled</p>
              <p className="text-gray-600 text-xs mt-0.5">Welcome back! We saved your details from last time. Just pick your payment and delivery.</p>
            </div>
          </div>
        )}
        {!user && search.guest && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
            You're checking out as a guest. Status updates will be texted manually by Jayden from <strong>813-797-0007</strong>. Log in to track orders on this site.
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input className={inputClass('name')} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input className={inputClass('email')} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input className={inputClass('phone')} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(xxx) xxx-xxxx" type="tel" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Delivery Option</h2>
              <div className="space-y-3 mb-4">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="delivery" value="pickup" checked={deliveryType === 'pickup'} onChange={() => setDeliveryType('pickup')} className="mt-0.5 accent-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">Pickup at Woodcliff Park</span>
                      <span className="font-bold text-blue-600 text-sm">${DELIVERY_FEE_PICKUP}.00</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">I will be able to pick up my order at Woodcliff Park</p>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === 'home' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="delivery" value="home" checked={deliveryType === 'home'} onChange={() => setDeliveryType('home')} className="mt-0.5 accent-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">Home Delivery (Woodcliff Area)</span>
                      <span className="font-bold text-blue-600 text-sm">${DELIVERY_FEE_HOME}.00</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">Delivered to your home address in Woodcliff (including estates)</p>
                  </div>
                </label>
              </div>
              {deliveryType === 'home' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address *</label>
                  <input className={inputClass('address')} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Woodcliff, NJ" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Terms & Conditions</h2>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 accent-blue-600 w-4 h-4"
                />
                <span className="text-sm text-gray-600">
                  Do you agree to the terms and conditions listed{' '}
                  <a
                    href="https://docs.google.com/document/d/1Wcl7Mm2fiUwW4Rb3HGFroPdEe1mDEPf6nePU6kwUHWI/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-medium"
                  >
                    here
                  </a>
                  ?
                </span>
              </label>
              {errors.terms && <p className="text-red-500 text-xs mt-2">{errors.terms}</p>}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Choose Your Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="hidden" />
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Cash</p>
                    <p className="text-gray-400 text-xs">USD</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'apple_cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="payment" value="apple_cash" checked={paymentMethod === 'apple_cash'} onChange={() => setPaymentMethod('apple_cash')} className="hidden" />
                  <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Apple Cash</p>
                    <p className="text-gray-400 text-xs">Apple Pay</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'venmo' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="payment" value="venmo" checked={paymentMethod === 'venmo'} onChange={() => setPaymentMethod('venmo')} className="hidden" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#008CFF' }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M19.4 2c.5 2.9-.8 5.7-2.6 8.2L13.5 22H7.3L4.6 3.4c1.2-.8 2.5-1.2 3.9-1.4l1.5 11.4 4.1-11.4H19.4z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Venmo</p>
                    <p className="text-gray-400 text-xs">@Jaydenp25</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'zelle' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="payment" value="zelle" checked={paymentMethod === 'zelle'} onChange={() => setPaymentMethod('zelle')} className="hidden" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#6D1ED4' }}>
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M15.75 2.25H8.67L2.25 13.5h6.38L5 21.75l16.75-12H14.5l1.25-7.5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Zelle<sup className="text-[9px]">®</sup></p>
                    <p className="text-gray-400 text-xs">813-797-0007</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-1">Signature</h2>
              <p className="text-gray-400 text-xs mb-3">Draw your initials or signature with your finger or mouse</p>
              <SignatureCanvas onSave={setSignature} />
              {errors.signature && <p className="text-red-500 text-xs mt-2">{errors.signature}</p>}
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{errors.submit}</div>
            )}
          </div>

          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Delivery fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
                  <span>Total</span>
                  <span className="text-blue-600 text-lg">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-blue-200"
            >
              {submitting ? 'Placing Order...' : `Place Order • $${total.toFixed(2)}`}
            </button>
            <p className="text-center text-xs text-gray-400">
              By placing this order you agree to our{' '}
              <a href="https://docs.google.com/document/d/1Wcl7Mm2fiUwW4Rb3HGFroPdEe1mDEPf6nePU6kwUHWI/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">terms and conditions</a>
            </p>
          </div>
        </div>
      </div>

      {showVenmo && (
        <VenmoModal
          total={total}
          onClose={() => setShowVenmo(false)}
          onPaid={() => { setShowVenmo(false); submitOrder() }}
        />
      )}
      {showZelle && (
        <ZelleModal
          total={total}
          onClose={() => setShowZelle(false)}
          onPaid={() => { setShowZelle(false); submitOrder() }}
        />
      )}
    </div>
  )
}
