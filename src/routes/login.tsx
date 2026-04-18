import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, Mail, Lock, User as UserIcon } from 'lucide-react'
import { login, signup, oauthLogin, AuthError } from '@netlify/identity'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
})

function LoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const search = useSearch({ from: '/login' })
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    navigate({ to: search.redirect || '/' })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setInfo('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate({ to: search.redirect || '/' })
      } else {
        const u = await signup(email, password, { full_name: name })
        if (u.confirmedAt) {
          navigate({ to: search.redirect || '/' })
        } else {
          setInfo('Check your email to confirm your account, then log in.')
          setMode('login')
        }
      }
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.status === 401) setErr('Invalid email or password.')
        else if (error.status === 403) setErr('Signups are disabled. Contact the site admin.')
        else if (error.status === 422) setErr('Please check your email and password (min 8 characters).')
        else setErr(error.message)
      } else {
        setErr('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleGoogle() {
    try {
      oauthLogin('google')
    } catch (error) {
      if (error instanceof AuthError) setErr(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white font-inter">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate({ to: '/' })} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-bold text-gray-900">
            Pay<span className="text-blue-600">Jayden</span>
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {mode === 'login' ? 'Log in to track your orders.' : 'Sign up to track orders and save your info for faster checkout.'}
          </p>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium py-2.5 rounded-xl transition-colors mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                />
              </div>
            </div>

            {err && <p className="text-red-500 text-xs">{err}</p>}
            {info && <p className="text-green-600 text-xs">{info}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setInfo('') }}
              className="text-blue-600 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Don't want to sign up?{' '}
          <button onClick={() => navigate({ to: '/checkout', search: { guest: true } as never })} className="text-blue-600 hover:underline">
            Continue as Guest
          </button>
        </p>
      </div>
    </div>
  )
}
