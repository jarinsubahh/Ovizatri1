import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'ovizatri.session'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Authentication request failed.')
  return data
}

function accountFromUser(user, token) {
  const type = user.role === 'traveler' ? 'user' : user.role
  const profile = user.profile || {}
  if (type === 'user') {
    return { token, accountID: user.id, accountType: type, email: user.email, userID: profile.user_id, username: profile.username, fullname: profile.fullname, gender: profile.gender, dob: profile.dob, phone: profile.phone, pfp_url: null }
  }
  if (type === 'agency') {
    return { token, accountID: user.id, accountType: type, email: user.email, agency: { agencyID: profile.agency_id, agencyName: profile.agency_name, ownerName: profile.owner_name, phone: profile.phone, experience_years: profile.experience_years, overview: profile.overview, websiteUrl: profile.website_url, tradeLicenseDoc_URL: profile.trade_license_doc_url, status: profile.status, address: profile.address } }
  }
  return { token, accountID: user.id, accountType: 'admin', email: user.email, adminID: profile.admin_id, adminName: profile.admin_name, roleLevel: profile.role_level }
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setLoading(false)
      return
    }
    try {
      const session = JSON.parse(stored)
      if (!session.token) throw new Error('Invalid session')
      request('/auth/me', { headers: { Authorization: `Bearer ${session.token}` } })
        .then((data) => persist(accountFromUser(data.user, session.token)))
        .catch(() => persist(null))
        .finally(() => setLoading(false))
    } catch {
      persist(null)
      setLoading(false)
    }
  }, [])

  function persist(next) {
    setAccount(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }

  async function login(role, email, password) {
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      const next = accountFromUser(data.user, data.token)
      if (role !== next.accountType) return { ok: false, error: 'This account does not match the selected sign-in type.' }
      persist(next)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }

  async function signUpUser(form) {
    try {
      const data = await request('/auth/signup/traveler', { method: 'POST', body: JSON.stringify(form) })
      persist(accountFromUser(data.user, data.token))
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }

  async function signUpAgency(form) {
    try {
      const data = await request('/auth/signup/agency', { method: 'POST', body: JSON.stringify(form) })
      persist(accountFromUser(data.user, data.token))
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }

  function logout() { persist(null) }

  return <AuthContext.Provider value={{ account, role: account?.accountType ?? null, loading, login, logout, signUpUser, signUpAgency }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
