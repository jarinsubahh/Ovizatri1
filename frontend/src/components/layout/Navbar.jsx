import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

const NAV_LINKS = [
  { to: '/destinations', label: 'Destinations' },
  { to: '/packages', label: 'Tour Packages' },
  { to: '/blog', label: 'Blog' },
]

export default function Navbar() {
  const { account, role, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuUserOpen, setMenuUserOpen] = useState(false)

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    setMenuOpen(false)
    setMenuUserOpen(false)
  }, [location.pathname])

  const transparent = isHome && !scrolled

  function handleLogout() {
    logout()
    setMenuUserOpen(false)
    navigate('/')
  }

  // Frontend-only auth gate: signed-in travelers go straight to their
  // wishlist, everyone else is routed to sign in with a return path so
  // ProtectedRoute sends them back to /wishlist after authenticating.
  function handleWishlistClick() {
    setMenuOpen(false)
    if (account) {
      navigate('/wishlist')
    } else {
      navigate('/signin', { state: { from: { pathname: '/wishlist' } } })
    }
  }

  const dashboardPath = role === 'agency' ? '/agency/dashboard' : role === 'admin' ? '/admin' : '/dashboard'
  const displayName =
    role === 'agency' ? account?.agency?.agencyName : role === 'admin' ? account?.adminName : account?.fullname

  return (
    <header className={`nav ${transparent ? 'nav-transparent' : 'nav-solid'}`}>
      <div className="container nav-inner">
        <Link to="/" className="nav-logo" aria-label="OVIZATRI home">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M4 21 C 10 21, 10 11, 16 11 C 22 11, 22 21, 28 21" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <circle cx="16" cy="7" r="2.2" fill="currentColor" />
          </svg>
          <span>OVIZATRI</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {l.label}
            </NavLink>
          ))}
          <button type="button" className="nav-link nav-link-btn" onClick={handleWishlistClick}>
            Wishlist
          </button>
        </nav>

        <div className="nav-actions">
          {!account && (
            <>
              <Link to="/signin" className="btn btn-ghost btn-sm nav-btn-ghost">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-gold btn-sm">
                Sign Up
              </Link>
            </>
          )}
          {account && (
            <div className="nav-user">
              <button className="nav-user-trigger" onClick={() => setMenuUserOpen((v) => !v)} aria-haspopup="true" aria-expanded={menuUserOpen}>
                <span className="nav-user-avatar">{(displayName || 'U').charAt(0).toUpperCase()}</span>
                <span className="nav-user-name">{displayName}</span>
              </button>
              {menuUserOpen && (
                <div className="nav-user-menu" role="menu">
                  <Link to={dashboardPath} role="menuitem">
                    {role === 'agency' ? 'Agency Dashboard' : role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                  </Link>
                  {role === 'user' && (
                    <Link to="/wishlist" role="menuitem">
                      Wishlist
                    </Link>
                  )}
                  <button role="menuitem" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
          <button className="nav-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="nav-mobile">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
          <button type="button" onClick={handleWishlistClick}>
            Wishlist
          </button>
          {!account ? (
            <>
              <Link to="/signin">Sign In</Link>
              <Link to="/signup">Sign Up</Link>
              <Link to="/agency/signin" className="nav-mobile-muted">
                Agency Sign In
              </Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath}>Dashboard</Link>
              <button onClick={handleLogout}>Sign Out</button>
            </>
          )}
        </div>
      )}
    </header>
  )
}