import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const SignInModal = ({ isOpen = false, onClose = () => {} }) => {
  const [open, setOpen] = useState(Boolean(isOpen))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, navigateByRole, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => setOpen(Boolean(isOpen)), [isOpen])

  function close() {
    setOpen(false)
    setError('')
    setEmail('')
    setPassword('')
    onClose && onClose()
  }

  async function handleSignIn() {
    setError('')
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    
    try {
      const result = await signIn(email, password)
      
      if (result.success) {
        // Use the role returned from signIn directly for navigation
        navigateByRole(navigate, result.role)
        close()
      } else {
        setError(result.error || 'Sign in failed. Please check your credentials.')
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


          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-border" />
            <div className="text-xs text-muted-foreground">or sign in with email</div>
            <div className="flex-1 h-px bg-border" />
          </div>

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
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleSignIn} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account? <a className="text-orange-600 underline cursor-pointer">Register here</a>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default SignInModal