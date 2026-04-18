import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, X, Truck, Package, Lock, User as UserIcon, LogIn } from 'lucide-react'
import type { Product } from './api.products'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/')({
  component: ShopPage,
})

export interface CartItem {
  product: Product
  quantity: number
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('payjayden-cart') || '[]')
  } catch {
    return []
  }
}

export function setCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem('payjayden-cart', JSON.stringify(items))
}

function ShopPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCartState] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCartState(getCart())
    fetch('/api/products')
      .then(r => r.json())
      .then((data: Product[]) => setProducts(data.filter(p => p.available)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  function updateCart(items: CartItem[]) {
    setCart(items)
    setCartState(items)
  }

  function addToCart(product: Product) {
    const existing = cart.find(i => i.product.id === product.id)
    const updated = existing
      ? cart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...cart, { product, quantity: 1 }]
    updateCart(updated)
    setAddedIds(prev => new Set([...prev, product.id]))
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(product.id); return n }), 1500)
  }

  function removeFromCart(productId: string) {
    updateCart(cart.filter(i => i.product.id !== productId))
  }

  function changeQty(productId: string, delta: number) {
    const updated = cart
      .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    updateCart(updated)
  }

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  function handleAdminLogin() {
    if (adminPassword === 'jaydendelivers2503') {
      navigate({ to: '/admin' })
    } else {
      setAdminError('Incorrect password. Please try again.')
      setAdminPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Pay<span className="text-blue-600">Jayden</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate({ to: '/account' })}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="max-w-[100px] truncate">{user.name || user.email}</span>
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: '/login', search: {} as never })}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log in
              </button>
            )}
            <button
              onClick={() => setAdminModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Admin Log-On</span>
              <span className="sm:hidden">Admin</span>
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Fast Local Delivery 🚀
          </h1>
          <p className="text-blue-100 text-lg max-w-lg mx-auto">
            Order snacks, drinks, and more — delivered to your door or ready for pickup at Woodcliff Park.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2 bg-blue-700/50 rounded-full px-4 py-2">
              <Package className="w-4 h-4 text-amber-300" />
              <span>Pickup: <strong className="text-amber-300">$5</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-blue-700/50 rounded-full px-4 py-2">
              <Truck className="w-4 h-4 text-amber-300" />
              <span>Home Delivery: <strong className="text-amber-300">$10</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Items</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white group">
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        addedIds.has(product.id)
                          ? 'bg-green-500 text-white scale-95'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {addedIds.has(product.id) ? '✓ Added!' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Your Cart
              </h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mt-1">Add some items to get started!</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                    <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                      <p className="text-blue-600 font-semibold text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(item.product.id, -1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="w-5 text-center font-medium text-sm">{item.quantity}</span>
                      <button onClick={() => changeQty(item.product.id, 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                      <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 ml-1">
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-500 text-sm">Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-xs">Delivery fee calculated at checkout</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); navigate({ to: '/checkout', search: {} as never }) }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Admin Log-On
              </h2>
              <button onClick={() => { setAdminModalOpen(false); setAdminError(''); setAdminPassword('') }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={e => { setAdminPassword(e.target.value); setAdminError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Enter admin password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              autoFocus
            />
            {adminError && <p className="text-red-500 text-xs mb-3">{adminError}</p>}
            <button
              onClick={handleAdminLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Enter Admin Panel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16 py-8 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} PayJayden — Local Delivery Service</p>
        <p className="mt-1 text-xs">Woodcliff Area</p>
      </footer>
    </div>
  )
}
