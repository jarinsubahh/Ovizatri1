import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ForgotPasswordModal from '../../components/common/ForgotPasswordModal'
import sundarban from '../../assets/images/sundarban.jpg'
import './Auth.css'

export default function UserSignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Enter both your email and password.')
      return
    }
    const result = await login('user', form.email, form.password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Traveler</p>
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to book tours, save destinations and write blogs.</p>

          {error && <div className="form-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.78rem',
                    color: 'var(--river)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="********" autoComplete="current-password" />
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>

          <p className="auth-switch">
            New to OVIZATRI? <Link to="/signup">Create an account</Link>
          </p>
          <p className="auth-switch">
            Managing a tour agency? <Link to="/agency/signin">Sign in as an agency</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <img src={sundarban} alt="" />
        <div className="auth-side-scrim">
          <blockquote>&ldquo;The forest along the bank gets genuinely loud at dusk.&rdquo;</blockquote>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={form.email}
      />
    </div>
  )
}