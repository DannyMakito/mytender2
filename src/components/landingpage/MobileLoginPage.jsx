import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const SignInForm = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, navigateByRole } = useAuth()
  const navigate = useNavigate()

  async function handleSignIn() {
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const result = await signIn(email, password)
      if (result.success) {
        navigateByRole(navigate, result.role)
      } else {
        setError(result.error || 'Sign in failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-base">{error}</div>
      )}
      <div className="space-y-2">
        <label className="text-base font-medium">Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-4 py-3.5 text-base"
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-base font-medium">Password *</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-4 py-3.5 text-base"
          placeholder="Enter your password"
          disabled={loading}
        />
      </div>
      <Button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 text-base font-semibold"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
      <div className="text-center text-base text-muted-foreground">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignUp} className="text-orange-600 underline font-semibold cursor-pointer">
          Register here
        </button>
      </div>
    </div>
  )
}

const SignUpForm = ({ onSwitchToSignIn }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSignup() {
    setError('')
    if (!email || !password || !confirm || !role) {
      setError('Please fill in all fields and select a role')
      return
    }
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const result = await signUp(email, password, role)
      if (result.success) {
        navigate('/onboarding')
      } else {
        setError(result.error || 'Sign up failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-base">{error}</div>
      )}
      <div className="space-y-2">
        <label className="text-base font-medium">Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-4 py-3.5 text-base"
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-base font-medium">Password *</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-4 py-3.5 text-base"
          placeholder="Create a secure password"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-base font-medium">Confirm Password *</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border px-4 py-3.5 text-base"
          placeholder="Confirm your password"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <label className="text-base font-medium">I am a *</label>
        <div className="flex gap-3">
          {[
            { value: 'client', label: 'SMME' },
            { value: 'pro', label: 'Professional' },
            { value: 'supplier', label: 'Supplier' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRole(opt.value)}
              disabled={loading}
              className={`flex-1 py-3 rounded-lg text-base font-medium ${
                role === opt.value
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                  : 'border-2 border-gray-300 text-gray-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={handleSignup}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 text-base font-semibold"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
      <div className="text-center text-base text-muted-foreground">
        Already have an account?{' '}
        <button onClick={onSwitchToSignIn} className="text-orange-600 underline font-semibold cursor-pointer">
          Sign in here
        </button>
      </div>
    </div>
  )
}

const MobileLoginPage = () => {
  const [view, setView] = useState('signin')

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 py-10">
        <div className="flex flex-col items-center mb-10">
          <img src="/mtlogo-bg.png" alt="MyTender logo" className="w-16 h-16 rounded-2xl shadow-lg mb-4 object-cover" />
          <h1 className="text-3xl font-bold text-gray-900">MyTender</h1>
          <p className="text-base text-muted-foreground mt-1.5">Win more tenders for your business</p>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {view === 'signin' ? (
            <SignInForm onSwitchToSignUp={() => setView('signup')} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setView('signin')} />
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileLoginPage
