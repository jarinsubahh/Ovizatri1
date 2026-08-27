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
  const agency = account.agency
  const [form, setForm] = useState({
    ownerName: agency.ownerName,
    phone: agency.phone,
    overview: agency.overview,
    websiteUrl: agency.websiteUrl || '',
  })
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Agency profile edits are local-only in this prototype (no backend yet).
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <DashboardShell title={agency.agencyName} subtitle="Agency" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Agency Profile</h1>
        <span className={'badge ' + (agency.status === 'verified' ? 'badge-success' : 'badge-gold')}>{agency.status.replace('_', ' ')}</span>
      </div>

      <div className="card card-pad" style={{ maxWidth: 560 }}>
        {saved && <div className="form-success-banner">Agency profile updated.</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="agencyName">Agency name</label>
            <input id="agencyName" value={agency.agencyName} disabled />
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
            <textarea id="overview" name="overview" rows={4} value={form.overview} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Trade license document</label>
            <input value={agency.tradeLicenseDoc_URL || 'No document on file'} disabled />
          </div>
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </DashboardShell>
  )
}
