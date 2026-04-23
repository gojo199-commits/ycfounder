import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))

      if (userDoc.exists()) {
        navigate('/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,102,0,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="card rounded-2xl p-10 border border-[#FF6600]/40">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-[#FF6600] font-extrabold text-3xl tracking-tight mb-1">
              YFounder
            </h1>
            <div className="w-8 h-[2px] bg-[#FF6600] mx-auto rounded-full" />
          </div>

          {/* Heading */}
          <h2 className="text-white font-bold text-2xl text-center mb-3">
            Join YFounder
          </h2>
          <p className="text-white/50 text-sm text-center mb-10 leading-relaxed">
            Sign in to find your co-founder and apply to YC together
          </p>

          {/* Google Sign In Button */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold rounded-lg px-6 py-4 hover:bg-gray-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
            ) : (
              /* Google SVG Icon */
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Error message */}
          {error && (
            <p className="text-red-400 text-sm text-center mt-4">{error}</p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-[#FF6600]/20" />
            <span className="text-white/30 text-xs">Secure sign-in via Google</span>
            <div className="flex-1 h-px bg-[#FF6600]/20" />
          </div>

          {/* Fine print */}
          <p className="text-white/25 text-xs text-center leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            We only use your Google profile information.
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-white/40 hover:text-[#FF6600] text-sm transition-colors duration-200">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
