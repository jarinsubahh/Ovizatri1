import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page container">
      <div className="empty-state">
        <p className="eyebrow">404</p>
        <h3>This page doesn't exist</h3>
        <p className="section-lead" style={{ margin: '0 auto 20px' }}>
          The page you're looking for may have moved or the link may be incorrect.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
