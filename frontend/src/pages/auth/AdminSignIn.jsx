import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

export default function AdminSignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const redirectTo = location.state?.from?.pathname || '/admin'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = await login('admin', form.email, form.password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-panel" style={{ flex: 1 }}>
        <div className="auth-card">
          <p className="eyebrow">Admin</p>
          <h1>Admin sign in</h1>
          <p className="auth-sub">Restricted to OVIZATRI platform administrators.</p>

          {error && <div className="form-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
