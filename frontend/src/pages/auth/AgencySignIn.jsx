import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { demoAgencyAccounts } from '../../data/mockData'
import sajekValley from '../../assets/images/sajekvalley.jpg'
import './Auth.css'

export default function AgencySignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const redirectTo = location.state?.from?.pathname || '/agency/dashboard'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Enter both your email and password.')
      return
    }
    const result = login('agency', form.email, form.password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  function fillDemo() {
    setForm({ email: demoAgencyAccounts[0].email, password: demoAgencyAccounts[0].password })
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Agency</p>
          <h1>Agency sign in</h1>
          <p className="auth-sub">Manage your tour packages, schedules and bookings.</p>

          {error && <div className="form-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Business email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@youragency.com" autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>

          <div className="auth-divider">or</div>
          <button type="button" className="btn btn-outline btn-block" onClick={fillDemo}>
            Use demo agency account
          </button>

          <p className="auth-switch">
            New agency? <Link to="/agency/signup">Register your agency</Link>
          </p>
          <p className="auth-switch">
            Traveling instead? <Link to="/signin">Sign in as a traveler</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <img src={sajekValley} alt="" />
        <div className="auth-side-scrim">
          <blockquote>&ldquo;Terraced cottages overlooking the reserve forest.&rdquo;</blockquote>
        </div>
      </div>
    </div>
  )
}
