import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import sajekValley from '../../assets/images/sajekvalley.jpg'
import './Auth.css'

export default function AgencySignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState('') // 'pending', 'rejected', or 'general'

  const redirectTo = location.state?.from?.pathname || '/agency/dashboard'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setErrorType('')

    if (!form.email || !form.password) {
      setError('Enter both your email and password.')
      return
    }

    const result = await login('agency', form.email, form.password)
    if (!result.ok) {
      setError(result.error)
      if (result.error.toLowerCase().includes('pending review')) {
        setErrorType('pending')
      } else if (result.error.toLowerCase().includes('rejected')) {
        setErrorType('rejected')
      } else if (result.error.toLowerCase().includes('suspended')) {
        setErrorType('suspended')
      } else {
        setErrorType('general')
      }
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Agency</p>
          <h1>Agency sign in</h1>
          <p className="auth-sub">Manage your tour packages, schedules and bookings.</p>

          {error && (
            <div 
              className={
                errorType === 'pending'
                  ? 'form-pending-banner'
                  : 'form-error-banner'
              }
              style={{
                borderRadius: 'var(--radius-s)',
                padding: '14px',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                marginBottom: '20px',
                background: errorType === 'pending' ? 'rgba(201, 161, 90, 0.15)' : 'rgba(165, 58, 46, 0.12)',
                border: errorType === 'pending' ? '1px solid var(--gold)' : '1px solid var(--error)',
                color: errorType === 'pending' ? 'var(--gold-dark)' : 'var(--error)'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                {errorType === 'pending' && '⏳ Account Approval Pending'}
                {errorType === 'rejected' && '⛔ Registration Rejected'}
                {errorType === 'suspended' && '⚠️ Account Suspended'}
              </div>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Business email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="contact@youragency.com" 
                autoComplete="email" 
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                value={form.password} 
                onChange={handleChange} 
                autoComplete="current-password" 
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>

          <p className="auth-switch">
            New agency? <Link to="/agency/signup">Register your agency</Link>
          </p>
          <p className="auth-switch">
            Traveling instead? <Link to="/signin">Sign in as a traveler</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <img src={sajekValley} alt="Sajek Valley" />
        <div className="auth-side-scrim">
          <blockquote>&ldquo;Terraced cottages overlooking the reserve forest.&rdquo;</blockquote>
        </div>
      </div>
    </div>
  )
}