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
            <div className="w-10 h-10 bg-orange-500 rounded shadow" />
          </div>
          <h3 className="text-center text-xl font-bold mb-2">Start Winning Tenders Today</h3>
          <p className="text-center text-sm text-muted-foreground mb-4">Join thousands of businesses finding and winning government tenders</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.6 12.237c0-.68-.06-1.333-.176-1.962H12v3.722h5.32c-.229 1.244-.922 2.298-1.97 3.012v2.504h3.183C20.63 18.11 21.6 15.34 21.6 12.237z" fill="#4285F4"/><path d="M12 22c2.7 0 4.966-.894 6.622-2.426l-3.183-2.504c-.882.593-2.01.945-3.439.945-2.643 0-4.88-1.784-5.674-4.177H2.95v2.62C4.596 19.888 8.023 22 12 22z" fill="#34A853"/><path d="M6.326 13.838A6.997 6.997 0 0 1 6 12c0-.68.116-1.337.326-1.838V7.542H2.95A9.992 9.992 0 0 0 2 12c0 1.62.37 3.153 1.02 4.458l3.306-2.62z" fill="#FBBC05"/><path d="M12 6.5c1.467 0 2.79.504 3.83 1.492l2.867-2.867C16.96 3.54 14.702 2.6 12 2.6 8.023 2.6 4.596 4.713 2.95 7.458l3.376 2.622C7.12 8.284 9.357 6.5 12 6.5z" fill="#EA4335"/></svg>
              Continue with Google
            </Button>
          </div>

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