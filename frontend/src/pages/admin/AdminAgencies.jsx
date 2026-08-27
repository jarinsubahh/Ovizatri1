import React, { useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { agencies as seedAgencies } from '../../data/mockData'
import { addAuditEntry } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/agencies', label: 'Agencies' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

export default function AdminAgencies() {
  const { account } = useAuth()
  // Local session-only state standing in for an agencies table update — a
  // real backend would PATCH the AGENCY.status column and this component
  // would just refetch.
  const [agencies, setAgencies] = useState(seedAgencies)

  function setStatus(agencyID, status, notes) {
    setAgencies((list) => list.map((a) => (a.agencyID === agencyID ? { ...a, status } : a)))
    addAuditEntry({ agencyID, adminID: account.adminID, notes, status_changed_to: status })
  }

  return (
    <DashboardShell title={account.adminName} subtitle="Administrator" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Agencies</h1>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Agency</th>
              <th>Owner</th>
              <th>Experience</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr key={a.agencyID}>
                <td>{a.agencyName}</td>
                <td>{a.ownerName}</td>
                <td>{a.experience_years} yrs</td>
                <td>
                  <span className={'badge ' + (a.status === 'verified' ? 'badge-success' : a.status === 'suspended' ? 'badge-error' : 'badge-gold')}>
                    {a.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {a.status !== 'verified' && (
                    <button className="btn btn-outline btn-sm" onClick={() => setStatus(a.agencyID, 'verified', 'Trade license verified against RJSC records.')}>
                      Verify
                    </button>
                  )}
                  {a.status !== 'suspended' && (
                    <button className="btn btn-danger btn-sm" onClick={() => setStatus(a.agencyID, 'suspended', 'Suspended pending further document review.')}>
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  )
}
