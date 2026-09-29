import React, { useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/agency/dashboard', label: 'Overview', exact: true },
  { to: '/agency/packages', label: 'Tour Packages' },
  { to: '/agency/profile', label: 'Agency Profile' },
]

export default function AgencyProfile() {
  const { account } = useAuth()
  const agency = account?.agency || {}
  const [form, setForm] = useState({
    ownerName: agency.ownerName || '',
    phone: agency.phone || '',
    overview: agency.overview || '',
    websiteUrl: agency.websiteUrl || '',
  })
  const [saved, setSaved] = useState(false)

  // Password change states
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', otp: '' })
  const [passMsg, setPassMsg] = useState({ error: '', success: '' })
  const [passLoading, setPassLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPassMsg({ error: '', success: '' })

    if (!passForm.currentPassword || !passForm.newPassword || !passForm.otp) {
      setPassMsg({ error: 'All fields and OTP are required.', success: '' })
      return
    }

    try {
      setPassLoading(true)
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account?.token}`,
        },
        body: JSON.stringify(passForm),
      })
      const data = await res.json()

      if (!res.ok) {
        setPassMsg({ error: data.message || 'Failed to change password.', success: '' })
        return
      }

      setPassMsg({ error: '', success: 'Agency password updated successfully!' })
      setPassForm({ currentPassword: '', newPassword: '', otp: '' })
    } catch (err) {
      setPassMsg({ error: 'Network error updating password.', success: '' })
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <DashboardShell title={agency.agencyName || 'Agency'} subtitle="Agency" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Agency Profile</h1>
        <span className={'badge ' + (agency.status === 'verified' ? 'badge-success' : 'badge-gold')}>
          {(agency.status || 'pending_review').replace('_', ' ')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        <div className="card card-pad">
          <h3 style={{ marginTop: 0, marginBottom: 14 }}>Agency Information</h3>
          {saved && <div className="form-success-banner">Agency profile updated.</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="agencyName">Agency name</label>
              <input id="agencyName" value={agency.agencyName || ''} disabled />
            </div>
            <div className="field">
              <label htmlFor="ownerName">Owner name</label>
              <input id="ownerName" name="ownerName" value={form.ownerName} onChange={handleChange} />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="websiteUrl">Website</label>
                <input id="websiteUrl" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="overview">Overview</label>
              <textarea id="overview" name="overview" rows={3} value={form.overview} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Agency Details
            </button>
          </form>
        </div>

        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Change Password</h3>
            <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>OTP: 123456</span>
          </div>

          {passMsg.error && <div className="form-error-banner" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{passMsg.error}</div>}
          {passMsg.success && <div className="form-success-banner" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{passMsg.success}</div>}

          <form onSubmit={handlePasswordChange}>
            <div className="field">
              <label htmlFor="agencyCurrentPassword">Current Password</label>
              <input
                id="agencyCurrentPassword"
                type="password"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="agencyNewPassword">New Password</label>
              <input
                id="agencyNewPassword"
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="agencyOtp">Verification Code (Fixed: 123456)</label>
              <input
                id="agencyOtp"
                type="text"
                value={passForm.otp}
                onChange={(e) => setPassForm((p) => ({ ...p, otp: e.target.value }))}
                placeholder="Enter 123456"
                required
              />
            </div>

            <button type="submit" className="btn btn-outline btn-sm" disabled={passLoading}>
              {passLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}