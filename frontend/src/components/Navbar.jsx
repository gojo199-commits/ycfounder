import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const navLinks = [
    { to: '/browse', label: 'Browse' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/profile', label: 'Profile' },
  ]

  return (
    <nav className="bg-black/95 border-b border-[#FF6600]/30 px-6 py-4 sticky top-0 z-50"
      style={{ backdropFilter: 'blur(8px)' }}>
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="text-[#FF6600] font-bold text-xl tracking-tight">YFounder</Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className="text-white hover:text-[#FF6600] transition-colors duration-200 text-sm font-medium">
              {l.label}
            </Link>
          ))}

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF6600]/40 hover:border-[#FF6600] transition-colors">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-[#FF6600]/20 flex items-center justify-center text-[#FF6600] font-bold text-sm">
                    {user.displayName?.[0] || 'Y'}
                  </div>}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-48 bg-black border border-[#FF6600]/40 rounded-xl shadow-xl shadow-black/50 py-2 z-50">
                <Link to="/profile" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2.5 text-white text-sm hover:bg-[#FF6600]/10 hover:text-[#FF6600] transition-colors">
                  My Profile
                </Link>
                <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2.5 text-white text-sm hover:bg-[#FF6600]/10 hover:text-[#FF6600] transition-colors">
                  Dashboard
                </Link>
                <div className="border-t border-[#FF6600]/20 my-1" />
                <button onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-white text-sm hover:bg-[#FF6600]/10 hover:text-[#FF6600] transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[#FF6600]">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-[#FF6600]/20 pt-4 space-y-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className="block py-3 px-2 text-[#FF6600] font-medium text-base hover:bg-[#FF6600]/10 rounded-lg transition-colors">
              {l.label}
            </Link>
          ))}
          <button onClick={handleSignOut}
            className="w-full text-left py-3 px-2 text-white/60 font-medium text-base hover:bg-[#FF6600]/10 rounded-lg transition-colors">
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}
