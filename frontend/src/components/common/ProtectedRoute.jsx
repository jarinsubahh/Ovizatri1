import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Gates a route to a specific account role. Redirects to the matching
 * sign-in page (preserving the intended destination) when unauthenticated,
 * or home if the logged-in role doesn't match.
 */
export default function ProtectedRoute({ role, children }) {
  const { account, role: currentRole, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!account) {
    const redirectTo = role === 'agency' ? '/agency/signin' : role === 'admin' ? '/admin/signin' : '/signin'
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (currentRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
