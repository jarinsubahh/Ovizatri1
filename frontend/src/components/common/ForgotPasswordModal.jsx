import React, { useState } from 'react'

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim() || !otp.trim() || !newPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Failed to reset password.')
        return
      }

      setSuccess('Password updated successfully! You can now sign in.')
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 20, 15, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card card-pad"
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'var(--paper)',
          boxShadow: 'var(--shadow-pop)',
          border: '1px solid var(--line-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Reset Password</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
          Enter your registered email and the verification code to set a new password.
        </p>

        {error && <div className="form-error-banner" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{error}</div>}
        {success && <div className="form-success-banner" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{success}</div>}

        <form onSubmit={handleReset}>
          <div className="field">
            <label htmlFor="reset-email">Account Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="reset-otp">Verification Code (OTP)</label>
              <span className="badge badge-gold" style={{ fontSize: '0.68rem', cursor: 'default' }}>
                Fixed Code: 123456
              </span>
            </div>
            <input
              id="reset-otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 123456"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="reset-pass">New Password</label>
            <input
              id="reset-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="reset-confirm-pass">Confirm New Password</label>
            <input
              id="reset-confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}