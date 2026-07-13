import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const GetStartedModal = ({ isOpen = false, onClose = () => { } }) => {
  const [open, setOpen] = useState(Boolean(isOpen))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp, navigateByRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => setOpen(Boolean(isOpen)), [isOpen])

  function close() {
    setOpen(false)
    setError('')
    setEmail('')
    setPassword('')
    setConfirm('')
    setRole('')
    onClose && onClose()
  }

  async function handleSignup() {
    setError('')

    // Validation
    if (!email || !password || !confirm || !role) {
      setError('Please fill in all fields and select a role')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password, role)

      if (result.success) {
        // Navigate to onboarding
        navigate('/onboarding')
        close()
      } else {
        setError(result.error || 'Sign up failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // lock body scroll when modal open
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl overflow-hidden">
        <button onClick={close} className="absolute top-3 right-3 text-muted-foreground">
          <XIcon className="size-5" />
        </button>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="flex items-center justify-center mb-4">
            <img src="/mtlogo-bg.png" alt="MyTender logo" className="w-10 h-10 rounded shadow object-cover" />
          </div>
          <h3 className="text-center text-xl font-bold mb-2">Start Winning Tenders Today</h3>
          <p className="text-center text-sm text-muted-foreground mb-4">Join thousands of businesses finding and winning government tenders</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}



          <div className="space-y-3">
            <label className="text-sm font-medium">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Enter your email"
              disabled={loading}
            />

            <label className="text-sm font-medium">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Create a secure password"
              disabled={loading}
            />

            <label className="text-sm font-medium">Confirm Password *</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRole('client')}
              disabled={loading}
              className={`flex-1 min-w-[100px] py-2 rounded-md text-sm ${role === 'client' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'border'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              SMME
            </button>
            <button
              onClick={() => setRole('pro')}
              disabled={loading}
              className={`flex-1 min-w-[100px] py-2 rounded-md text-sm ${role === 'pro' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'border'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Professional
            </button>
            <button
              onClick={() => setRole('supplier')}
              disabled={loading}
              className={`flex-1 min-w-[100px] py-2 rounded-md text-sm ${role === 'supplier' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'border'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Supplier
            </button>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Already have an account? <a className="text-orange-600 underline cursor-pointer">Sign in here</a>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default GetStartedModal