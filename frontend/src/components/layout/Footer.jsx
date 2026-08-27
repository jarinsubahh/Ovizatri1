import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="nav-logo footer-logo">
            <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
              <path d="M4 21 C 10 21, 10 11, 16 11 C 22 11, 22 21, 28 21" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <circle cx="16" cy="7" r="2.2" fill="currentColor" />
            </svg>
            <span>OVIZATRI</span>
          </div>
          <p className="footer-tag">A guide to travelling Bangladesh, built as a DBMS course project.</p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/destinations">Destinations</Link>
          <Link to="/packages">Tour Packages</Link>
          <Link to="/blog">Blog</Link>
        </div>

        <div className="footer-col">
          <h4>For Agencies</h4>
          <Link to="/agency/signin">Agency Sign In</Link>
          <Link to="/agency/signup">List Your Agency</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/signin">Traveler Sign In</Link>
          <Link to="/signup">Create an Account</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>&copy; {new Date().getFullYear()} OVIZATRI. Student project — not a live booking service.</span>
      </div>
    </footer>
  )
}
