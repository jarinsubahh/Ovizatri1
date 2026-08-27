import React, { createContext, useContext, useEffect, useState } from 'react'
import { demoUsers, demoAdmins, demoAgencyAccounts, agencies } from '../data/mockData'

// ============================================================================
// AuthContext — mock authentication only.
//
// There is no backend yet, so this validates against the demo ACCOUNT
// records in mockData.js and persists the "session" to localStorage. When
// the PostgreSQL-backed API exists, `login`/`signUp` are the two functions
// that need to be pointed at real endpoints; every consuming component only
// reads `account` / `role` from this context, so the rest of the app should
// not need to change.
// ============================================================================

const AuthContext = createContext(null)
const STORAGE_KEY = 'ovizatri.session'

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setAccount(JSON.parse(raw))
    } catch {
      // ignore corrupted session
    }
    setLoading(false)
  }, [])

  function persist(next) {
    setAccount(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }

  function login(role, email, password) {
    const pool = role === 'user' ? demoUsers : role === 'agency' ? demoAgencyAccounts : demoAdmins
    const match = pool.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password)
    if (!match) {
      return { ok: false, error: 'Email or password is incorrect.' }
    }
    const { password: _pw, ...safe } = match
    let profile = safe
    if (role === 'agency') {
      const agency = agencies.find((a) => a.agencyID === match.agencyID)
      profile = { ...safe, agency }
    }
    persist(profile)
    return { ok: true }
  }

  function signUpUser(form) {
    const exists = demoUsers.some((u) => u.email.toLowerCase() === form.email.toLowerCase())
    if (exists) return { ok: false, error: 'An account with this email already exists.' }
    const profile = {
      accountID: `ACC-U${Math.floor(Math.random() * 9000) + 100}`,
      accountType: 'user',
      email: form.email,
      userID: `USR-${Math.floor(Math.random() * 9000) + 100}`,
      username: form.username,
      fullname: form.fullname,
      gender: form.gender,
      dob: form.dob,
      phone: form.phone,
      pfp_url: null,
    }
    persist(profile)
    return { ok: true }
  }

  function signUpAgency(form) {
    const profile = {
      accountID: `ACC-A${Math.floor(Math.random() * 9000) + 100}`,
      accountType: 'agency',
      email: form.email,
      agency: {
        agencyID: `AGN-${Math.floor(Math.random() * 9000) + 100}`,
        agencyName: form.agencyName,
        ownerName: form.ownerName,
        phone: form.phone,
        experience_years: Number(form.experience_years) || 0,
        overview: form.overview,
        websiteUrl: form.websiteUrl,
        tradeLicenseDoc_URL: form.tradeLicenseFileName ? `/docs/${form.tradeLicenseFileName}` : null,
        status: 'pending_review',
        address: {
          street_address: form.street_address,
          thana: form.thana,
          district: form.district,
          division: form.division,
          postalCode: form.postalCode,
        },
      },
    }
    persist(profile)
    return { ok: true }
  }

  function logout() {
    persist(null)
  }

  const value = {
    account,
    role: account?.accountType ?? null,
    loading,
    login,
    logout,
    signUpUser,
    signUpAgency,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
